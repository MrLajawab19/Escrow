/**
 * disputeEngine.js
 * Universal Rule Engine for all 20+ product types on ScrowX.
 */

// Categorize product types based on NewDeedPage mappings
const CATEGORY_MAP = {
  // Content & Copywriting
  'Blog writing': 'CONTENT',
  'SEO writing': 'CONTENT',
  'Ghostwriting': 'CONTENT',
  'Copywriting for ads': 'CONTENT',
  'Social media captions': 'CONTENT',
  'Email marketing content': 'CONTENT',
  'Reddit/Quora answers': 'CONTENT',
  
  // Design (Logos, UI/UX, Posters)
  'Logos & Branding': 'DESIGN',
  'UI/UX Design': 'DESIGN',
  'Poster/Flyer/Banner': 'DESIGN',
  'Social Media Posts': 'DESIGN',
  'NFT Art': 'DESIGN',
  'Illustration/Comics': 'DESIGN',
  '3D Modeling/Rendering': 'DESIGN',
  
  // Video
  'Video Editing': 'VIDEO',
  'Motion Graphics': 'VIDEO',
  
  // Dev
  'Website Development': 'DEV',
  'App Development': 'DEV',
  'Landing Page': 'DEV',
  
  // Social/Growth
  'Instagram Growth': 'SOCIAL',
  'Instagram Promotion': 'SOCIAL',
  'YouTube promotion': 'SOCIAL',
  'Telegram promotion': 'SOCIAL',
  'Twitter growth': 'SOCIAL',
  'Reddit upvotes': 'SOCIAL',
  'Influencer shoutouts': 'SOCIAL',
  'SEO services': 'SOCIAL',
  
  // Physical
  'Physical Item Escrow (No COD)': 'PHYSICAL',
  'Clothing': 'PHYSICAL',
  'Sneakers': 'PHYSICAL',
  'Accessories': 'PHYSICAL',
  
  // Gaming
  'Gaming account sales': 'GAMING',
  'In-game currency': 'GAMING',
  'Game boosting': 'GAMING',
};

const getCategory = (productType) => {
  if (!productType) return 'GENERAL';
  return CATEGORY_MAP[productType] || 'GENERAL';
};

const extractProofData = (deed, deliveryEvent) => {
  // TODO: PRODUCT CATEGORY GAP - Deed.title is a fragile fallback. 
  // The new schema lacks a strict subcategory enum like the old order.scopeBox.productType.
  // See [Ticket: Add productCategory to Deed]
  const productType = deed.title || deed.transactionType || 'Unknown';
  const category = getCategory(productType);
  
  let deliveryPayload = {};
  if (deliveryEvent && deliveryEvent.payload) {
    try {
      deliveryPayload = typeof deliveryEvent.payload === 'string' ? JSON.parse(deliveryEvent.payload) : deliveryEvent.payload;
    } catch(e) {}
  }
  
  const deliveryFiles = deliveryPayload.fileUrls || [];
  const externalLinks = deliveryPayload.externalLinks || [];
  
  const proof = {
    category,
    productType,
    hasDelivery: deliveryFiles.length > 0 || externalLinks.length > 0,
    deliveryFileTypes: deliveryFiles.map(f => (typeof f === 'string' ? f : (f.url || f.fileUrl || '')).split('.').pop().toLowerCase()),
    deadlineMissed: false
  };

  // Universal checks
  if (deed.deadline) {
    const deadlineDate = new Date(deed.deadline);
    const submissionDate = deliveryEvent ? new Date(deliveryEvent.timestamp) : new Date();
    if (submissionDate > deadlineDate) {
      proof.deadlineMissed = true;
    }
  }

  // Category specific proofs (migrated from Order to Deed where applicable)
  switch (category) {
    case 'CONTENT':
      proof.promisedWordCount = (deed.scopeBox && deed.scopeBox.contentWritingSpecific && deed.scopeBox.contentWritingSpecific.wordCount) || 0;
      proof.isPdfOrDoc = proof.deliveryFileTypes.some(t => ['pdf', 'docx', 'txt', 'doc'].includes(t));
      break;
    case 'DESIGN':
      proof.expectedFormats = (deed.deliverableFormats && deed.deliverableFormats.length > 0) 
        ? deed.deliverableFormats 
        : (deed.scopeBox && deed.scopeBox.logoSpecific && deed.scopeBox.logoSpecific.fileFormats) || [];
      proof.hasSourceFile = proof.deliveryFileTypes.some(t => ['fig', 'ai', 'psd', 'xd'].includes(t));
      break;
    case 'VIDEO':
      proof.expectedFormats = ['mp4', 'mov', 'avi', 'mkv'];
      proof.hasVideoFile = proof.deliveryFileTypes.some(t => proof.expectedFormats.includes(t));
      break;
    case 'DEV':
      proof.hasZipOrRepo = proof.deliveryFileTypes.some(t => ['zip', 'rar', 'gz', 'tar'].includes(t));
      proof.hasUrlDelivery = externalLinks.some(url => url.startsWith('http'));
      break;
    case 'SOCIAL':
      proof.hasScreenshots = proof.deliveryFileTypes.some(t => ['png', 'jpg', 'jpeg'].includes(t));
      break;
    case 'PHYSICAL':
      // TODO: PHYSICAL TRACKING GAP - No deliveryTrackingInfo on Deed or Ledger post-migration.
      // String-matching is a weak placeholder. See [Ticket: Add tracking payload schema to Ledger]
      proof.hasTrackingNumber = (deliveryPayload.description || '').toLowerCase().includes('tracking');
      break;
    case 'GAMING':
      proof.hasLoginScreenshots = proof.deliveryFileTypes.some(t => ['png', 'jpg', 'jpeg'].includes(t));
      break;
    default:
      break;
  }

  return proof;
};

const runDisputeEngine = (deed, dispute, proofData) => {
  let riskScore = 0;
  let flags = [];
  let faultSide = 'UNKNOWN';

  // 1. Universal Checks
  if (!proofData.hasDelivery) {
    riskScore += 50;
    flags.push({ type: 'CRITICAL', reason: 'Seller did not upload any delivery files.' });
    faultSide = 'SELLER';
  }

  if (proofData.deadlineMissed) {
    riskScore += 20;
    flags.push({ type: 'WARNING', reason: 'Seller missed the delivery deadline.' });
    if (faultSide === 'UNKNOWN') faultSide = 'SELLER';
  }

  const raiseTimeDiff = new Date(dispute.createdAt) - new Date(deed.updatedAt);
  if (raiseTimeDiff < 1000 * 60 * 60) { // < 1 hour
    riskScore += 10;
    flags.push({ type: 'NOTICE', reason: 'Buyer raised dispute extremely quickly after delivery.' });
  }

  // 2. Category specific rules
  switch (proofData.category) {
    case 'CONTENT':
      if (proofData.hasDelivery && !proofData.isPdfOrDoc) {
        riskScore += 30;
        flags.push({ type: 'WARNING', reason: 'Content delivery is not in a standard document format (PDF/DOCX/TXT).' });
      }
      break;
    case 'DESIGN':
      if (proofData.hasDelivery && !proofData.deliveryFileTypes.some(t => ['png', 'jpg', 'jpeg', 'pdf', 'svg', 'fig', 'psd', 'ai'].includes(t))) {
        riskScore += 30;
        flags.push({ type: 'WARNING', reason: 'No recognizable design file formats found in delivery.' });
      }
      break;
    case 'VIDEO':
      if (proofData.hasDelivery && !proofData.hasVideoFile) {
        riskScore += 30;
        flags.push({ type: 'WARNING', reason: 'No valid video file format found in delivery.' });
      }
      break;
    case 'DEV':
      if (proofData.hasDelivery && !proofData.hasZipOrRepo && !proofData.hasUrlDelivery) {
        riskScore += 30;
        flags.push({ type: 'WARNING', reason: 'No code bundle (ZIP) or URL provided.' });
      }
      break;
    case 'SOCIAL':
    case 'GAMING':
      if (proofData.hasDelivery && !proofData.hasScreenshots && !proofData.hasLoginScreenshots) {
        riskScore += 25;
        flags.push({ type: 'WARNING', reason: 'No screenshot evidence provided in delivery.' });
      }
      break;
    case 'PHYSICAL':
      if (!proofData.hasTrackingNumber) {
        riskScore += 40;
        flags.push({ type: 'WARNING', reason: 'No tracking number provided for physical goods.' });
      }
      break;
  }

  // Final determination
  if (riskScore > 100) riskScore = 100;
  
  if (riskScore >= 50 && faultSide === 'UNKNOWN') faultSide = 'SELLER';
  if (riskScore < 30) faultSide = 'BUYER'; // low risk means delivery was likely fine

  const autoRecommendation = riskScore >= 50 ? 'REFUND' : 'RELEASE';

  return {
    riskScore,
    flagCount: flags.length,
    hasCritical: flags.some(f => f.type === 'CRITICAL'),
    faultSide,
    autoRecommendation,
    flags,
    category: proofData.category,
    productType: proofData.productType
  };
};

module.exports = {
  extractProofData,
  runDisputeEngine
};
