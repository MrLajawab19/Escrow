import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const platforms = ['Upwork', 'Fiverr', 'Freelancer', 'Instagram', 'Telegram', 'WhatsApp', 'Twitter', 'Reddit', 'Other'];

// Country to currency mapping
const countryCurrencyMap = {
  'India': 'INR',
  'USA': 'USD',
  'UK': 'GBP',
  'Canada': 'CAD',
  'Australia': 'AUD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Finland': 'EUR',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Bulgaria': 'BGN',
  'Croatia': 'EUR',
  'Slovenia': 'EUR',
  'Slovakia': 'EUR',
  'Estonia': 'EUR',
  'Latvia': 'EUR',
  'Lithuania': 'EUR',
  'Luxembourg': 'EUR',
  'Malta': 'EUR',
  'Cyprus': 'EUR',
  'Greece': 'EUR',
  'Portugal': 'EUR',
  'Ireland': 'EUR',
  'Japan': 'JPY',
  'South Korea': 'KRW',
  'China': 'CNY',
  'Singapore': 'SGD',
  'Hong Kong': 'HKD',
  'Taiwan': 'TWD',
  'Thailand': 'THB',
  'Malaysia': 'MYR',
  'Indonesia': 'IDR',
  'Philippines': 'PHP',
  'Vietnam': 'VND',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'Venezuela': 'VES',
  'Uruguay': 'UYU',
  'Paraguay': 'PYG',
  'Bolivia': 'BOB',
  'Ecuador': 'USD',
  'Guyana': 'GYD',
  'Suriname': 'SRD',
  'South Africa': 'ZAR',
  'Nigeria': 'NGN',
  'Kenya': 'KES',
  'Ghana': 'GHS',
  'Ethiopia': 'ETB',
  'Uganda': 'UGX',
  'Tanzania': 'TZS',
  'Morocco': 'MAD',
  'Egypt': 'EGP',
  'Algeria': 'DZD',
  'Tunisia': 'TND',
  'Libya': 'LYD',
  'Sudan': 'SDG',
  'Somalia': 'SOS',
  'Djibouti': 'DJF',
  'Eritrea': 'ERN',
  'Comoros': 'KMF',
  'Mauritius': 'MUR',
  'Seychelles': 'SCR',
  'Madagascar': 'MGA',
  'Malawi': 'MWK',
  'Zambia': 'ZMW',
  'Zimbabwe': 'ZWL',
  'Botswana': 'BWP',
  'Namibia': 'NAD',
  'Lesotho': 'LSL',
  'Eswatini': 'SZL',
  'Mozambique': 'MZN',
  'Angola': 'AOA',
  'Congo': 'CDF',
  'Gabon': 'XAF',
  'Cameroon': 'XAF',
  'Central African Republic': 'XAF',
  'Chad': 'XAF',
  'Equatorial Guinea': 'XAF',
  'Sao Tome and Principe': 'STD',
  'Democratic Republic of the Congo': 'CDF',
  'Burundi': 'BIF',
  'Rwanda': 'RWF',
  'Other': 'USD'
};

const countries = Object.keys(countryCurrencyMap);
const currencies = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'KRW', 'CNY', 'SGD', 'HKD', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'VES', 'UYU', 'PYG', 'BOB', 'ZAR', 'NGN', 'KES', 'GHS', 'ETB', 'UGX', 'TZS', 'MAD', 'EGP', 'DZD', 'TND', 'LYD', 'SDG', 'SOS', 'DJF', 'ERN', 'KMF', 'MUR', 'SCR', 'MGA', 'MWK', 'ZMW', 'ZWL', 'BWP', 'NAD', 'LSL', 'SZL', 'MZN', 'AOA', 'CDF', 'XAF', 'STD', 'BIF', 'RWF', 'Other'];
const serviceTypes = [
  '🎨 Digital Creative Services',
  '💻 Freelance Development Services',
  '📝 Content and Copywriting Services',
  '📢 Social Media & Marketing Services',
  '🧑‍🏫 Education & Mentorship',
  '🕹️ Gaming & Digital Goods',
  '💾 Digital Products / Tools',
  '🕵️ Grey/Hacker Services',
  '🤝 Service Exchange & Arbitrage',
  '📲 Account Services',
  '🔗 Affiliate & Referral Services',
  '🛒 E-Commerce & Online Stores',
  '📌 Miscellaneous Services'
];

// Product types mapped to service types
const productTypeMapping = {
  '🎨 Digital Creative Services': [
    'Logo design',
    'Poster/flyer/banner design',
    'Social media post creation',
    'Video editing',
    'Motion graphics',
    'NFT art creation',
    'Illustration / Comics',
    '3D modeling / rendering'
  ],
  '💻 Freelance Development Services': [
    'Website development',
    'App development',
    'Landing page creation',
    'Script writing',
    'Web scraping tools',
    'Discord/Telegram bots',
    'API integrations',
    'SaaS product prototypes'
  ],
  '📝 Content and Copywriting Services': [
    'Blog writing',
    'SEO writing',
    'Ghostwriting',
    'Copywriting for ads',
    'Social media captions',
    'Email marketing content',
    'Reddit/Quora answers'
  ],
  '📢 Social Media & Marketing Services': [
    'Instagram Growth',
    'Instagram Promotion',
    'YouTube promotion',
    'Telegram promotion',
    'Twitter growth',
    'Reddit upvotes',
    'Influencer shoutouts',
    'SEO services',
    'Ad campaign setup'
  ],
  '🧑‍🏫 Education & Mentorship': [
    'Exam tutoring',
    'Freelance/startup mentorship',
    'Career guidance',
    'Skill courses',
    'Crypto/stock mentorship',
    'Language classes'
  ],
  '🕹️ Gaming & Digital Goods': [
    'Gaming account sales',
    'In-game currency',
    'Modded apps/APKs',
    'Cheats',
    'Gift cards',
    'Game boosting',
    'Custom avatars'
  ],
  '💾 Digital Products / Tools': [
    'Notion templates',
    'Resume templates',
    'UI kits',
    'Course PDFs',
    'Instagram templates',
    'Trading indicators',
    'Premium bots'
  ],
  '🕵️ Grey/Hacker Services': [
    'Account recovery',
    'Database access',
    'Fake ID/certificate',
    'SIM swapping',
    'Crypto scam tools',
    'Bot farms'
  ],
  '🤝 Service Exchange & Arbitrage': [
    'Restricted platform purchasing',
    'Currency conversion',
    'Group buying'
  ],
  '📲 Account Services': [
    'Selling verified accounts',
    'Username sniping',
    'Channel growth',
    'Page recovery'
  ],
  '🔗 Affiliate & Referral Services': [
    'Affiliate link promotion',
    'Referral traffic generation'
  ],
  '🛒 E-Commerce & Online Stores': [
    'Physical Item Escrow (No COD)'
    // Reserved space for future sub-services:
    // 'Digital Storefront Escrow',
    // 'Wholesale Escrow',
    // 'Marketplace Integration'
  ],
  '📌 Miscellaneous Services': [
    'Astrology/Tarot reading',
    'Manifestation coaching',
    'Fitness/diet plans',
    'Resume building',
    'LinkedIn optimization',
    'Online therapy',
    'Voiceover'
  ]
};

const conditions = ['New', 'Used', 'Refurbished', 'Other'];
const logoStyles = ['Minimalist', 'Vintage', 'Modern', 'Hand-drawn', '3D'];
// Poster/Flyer/Banner constants
const posterResolutions = ['72 DPI', '150 DPI', '300 DPI'];
const posterOrientations = ['Portrait', 'Landscape', 'Square'];
const posterDesignStyles = ['Minimalist', 'Corporate', 'Vintage', 'Bold', 'Artistic', 'Other'];
// Social Media Post constants
const socialFormats = ['Image', 'Carousel', 'Reel/Short Video', 'Story'];
const socialAspectRatios = ['1:1', '4:5', '16:9', '9:16', 'Custom'];
const socialResolutions = ['1080×1080', '1920×1080', '1080×1920', 'Custom'];
// Video Editing constants
const videoSoftwares = ['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Sony Vegas', 'Blender', 'After Effects', 'Other'];
const videoResolutions = ['720p', '1080p', '4K'];
const videoFrameRates = ['24 FPS', '30 FPS', '60 FPS', '90 FPS', '120 FPS'];
const videoFileFormats = ['MP4', 'MOV', 'AVI', 'MKV'];
// Motion Graphics constants
const motionStyles = ['Explainer', 'Kinetic Typography', '3D Motion', 'Infographic', 'Abstract', 'Other'];
const motionResolutions = ['720p', '1080p', '4K'];
const motionFrameRates = ['24 FPS', '30 FPS', '60 FPS', '90 FPS', '120 FPS'];
const motionFileFormats = ['MP4', 'MOV', 'GIF', 'WEBM'];
// NFT Art constants
const nftTypes = ['1/1 Artwork', 'Generative Collection', 'Animated NFT', '3D NFT', 'Other'];
const nftStyles = ['Abstract', 'Cartoon', 'Realistic', 'Pixel Art', '3D Render', 'Other'];
const nftResolutions = ['1080x1080', '2048x2048', '4096x4096', 'Custom'];
const nftFileFormats = ['PNG', 'JPG', 'GIF', 'MP4', 'GLB'];
const nftBlockchains = ['Ethereum', 'Polygon', 'Solana', 'Tezos', 'Other'];
// Illustration/Comics constants
const illustrationTypes = ['Single Artwork', 'Comic Strip', 'Full Comic Book', 'Character Design', 'Other'];
const illustrationStyles = ['Manga', 'Western Comic', 'Realistic', 'Cartoon', 'Minimalist', 'Other'];
const illustrationResolutions = ['1080x1080', '2048x2048', '4096x4096', 'Custom'];
const illustrationFileFormats = ['PNG', 'JPG', 'PDF', 'PSD', 'AI'];
const illustrationColorOptions = ['Full Color', 'Black & White'];
// 3D Modeling/Rendering constants
const modelTypes = ['Product Visualization', 'Architectural', 'Character', 'Environment', 'Other'];
const detailLevels = ['Low Poly', 'Mid Poly', 'High Poly'];
const renderingQualities = ['Draft', 'Standard', 'Photorealistic'];
const modelFileFormats = ['OBJ', 'FBX', 'STL', 'BLEND', 'GLB', 'Other'];
const textureFormats = ['JPG', 'PNG', 'TIFF'];
const renderResolutions = ['1080p', '1440p', '4K', 'Custom'];

// Website Development constants
const websiteTypes = ['Business', 'eCommerce', 'Blog', 'Portfolio', 'Web App', 'Other'];
const technologyStacks = ['HTML/CSS/JS', 'React', 'Angular', 'Vue', 'PHP', 'Laravel', 'Django', 'Node.js', 'WordPress', 'Shopify', 'Other'];
const browserCompatibility = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Other'];
const hostingResponsibility = ['Buyer', 'Seller', 'Shared'];
const securityRequirements = ['SSL', 'User Authentication', 'Data Encryption', 'Other'];

// App Development constants
const appTypes = ['Android', 'iOS', 'Cross-platform', 'Web App', 'Other'];
const developmentFrameworks = ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'Xamarin', 'Ionic', 'NativeScript', 'Other'];
const appSecurityRequirements = ['Data Encryption', 'Secure Authentication', 'API Security', 'Other'];
const appStoreSubmissionResp = ['Buyer', 'Seller', 'Not Applicable'];

// Instagram Growth constants
const instagramGrowthServices = ['Followers Growth', 'Likes on Reels', 'Comments on Reels'];
const growthMethods = ['Organic Growth', 'Paid Advertising', 'Influencer Collaborations', 'Content Strategy', 'Engagement Pods', 'Other'];

// Instagram Promotion constants
const instagramPromotionServices = ['Logo Promotion', 'Song Promotion', 'Story Promotion', 'Repost Promotion', 'Link Promotion (via Broadcast Channel)'];
const logoPromotionPlacements = ['Feed Post', 'Story', 'Reel', 'Profile Highlight'];
const songPromotionFormats = ['Reel', 'Story', 'Post'];
const storyTypes = ['Static Image', 'Video', 'Poll/Quiz', 'Link Swipe Up'];

// YouTube Promotion constants
const youtubePromotionTypes = ['Views', 'Subscribers', 'Likes', 'Comments', 'Shares'];
const promotionMethods = ['Organic', 'Ads via Google Ads', 'Influencer Shoutouts'];

// Influencer Shoutout Promotion constants
const influencerPlatforms = ['Instagram', 'YouTube', 'Both'];
const instagramPromotionTypes = ['Reel', 'Post', 'Story', 'Caption Mention', 'Link in Bio'];
const youtubePromotionTypesInfluencer = ['Shorts', 'Full Video Mention', 'Caption Mention', 'Pinned Comment', 'Link in Description'];

// Gaming Account Sale constants
const gameNames = ['Fortnite', 'PUBG', 'Call of Duty', 'Apex Legends', 'Valorant', 'League of Legends', 'Dota 2', 'Counter-Strike', 'Overwatch', 'Rocket League', 'FIFA', 'Other'];
const gamingPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'Other'];

// E-Commerce Physical Item Escrow constants
const ecommerceProductTypes = ['Clothing', 'Sneakers', 'Accessories', 'Other'];
const courierProviders = ['BlueDart', 'Delhivery', 'DTDC', 'Shiprocket', 'Other'];

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [buyerData, setBuyerData] = useState(null);
  const [form, setForm] = useState({
    platform: '',
    sellerPlatformLink: '',
    serviceType: '',
    country: '',
    currency: '',
    sellerContact: '',
    scopeBox: {
      title: '',
      productType: '',
      productLink: '',
      description: '',
      attachments: [],
      condition: '',
      deadline: '',
      price: '',
      logoSpecific: {
        businessName: '',
        keywordIndustry: '',
        logoStyle: '',
        colorPreferred: ''
      },
      posterSpecific: {
        width: '',
        height: '',
        resolution: '',
        orientation: '',
        textContent: '',
        brandColors: '',
        fonts: '',
        designStyle: ''
      },
      socialPostSpecific: {
        postFormat: '',
        aspectRatio: '',
        resolution: '',
        postCount: '',
        finalCaption: '',
        hashtags: ''
      },
      videoEditingSpecific: {
        duration: '',
        software: '',
        resolution: '',
        frameRate: '',
        format: '',
        audioTrack: '',
        videoCount: '',
        storyboard: ''
      },
      motionGraphicsSpecific: {
        animationStyle: '',
        duration: '',
        resolution: '',
        frameRate: '',
        format: '',
        audioRequired: '',
        textRequired: '',
        storyboardText: '',
        storyboardPdf: null,
        referenceFiles: [],
        brandGuidelinesPdf: null
      },
      nftArtSpecific: {
        nftType: '',
        nftTypeOther: '',
        artworkStyle: '',
        artworkStyleOther: '',
        resolution: '',
        resolutionCustom: '',
        fileFormat: '',
        blockchain: '',
        blockchainOther: '',
        metadataRequired: '',
        numberOfArtworks: '',
        ownershipTransfer: '',
        refMoodboardFiles: [],
        styleGuidePdf: null,
        metadataTemplate: null
      },
      illustrationSpecific: {
        illustrationType: '',
        illustrationTypeOther: '',
        artworkStyle: '',
        artworkStyleOther: '',
        numberOfPages: '',
        resolution: '',
        resolutionCustom: '',
        fileFormat: '',
        colorOption: '',
        textRequired: '',
        scriptDialogue: '',
        ownershipTransfer: '',
        refArtworkFiles: [],
        scriptStoryboard: null,
        guidelinesPdf: null
      },
      model3dSpecific: {
        modelType: '',
        modelTypeOther: '',
        detailLevel: '',
        renderingQuality: '',
        fileFormat: '',
        fileFormatOther: '',
        textureRequired: '',
        textureFormat: '',
        animationRequired: '',
        animationDuration: '',
        numberOfViews: '',
        renderResolution: '',
        renderResolutionCustom: '',
        ownershipTransfer: '',
        refModelFiles: [],
        technicalDrawings: null,
        guidelinesPdf: null
      },
      appDevelopmentSpecific: {
        appType: '',
        appTypeOther: '',
        developmentFrameworks: [],
        targetOsVersions: [],
        numberOfScreens: '',
        offlineFunctionality: '',
        userAuthentication: '',
        backendResponsibility: '',
        keyFeatures: '',
        thirdPartyIntegrations: '',
        securityRequirements: [],
        securityRequirementsOther: '',
        performanceTargets: '',
        sourceCodeDelivery: '',
        appStoreSubmission: '',
        documentation: '',
        uiuxMockups: [],
        guidelines: null
      },
      websiteDevelopmentSpecific: {
        websiteType: '',
        websiteTypeOther: '',
        technologyStack: [],
        numberOfPages: '',
        responsiveDesign: '',
        browserCompatibility: [],
        hostingResponsibility: '',
        keyFeatures: '',
        adminPanel: '',
        thirdPartyIntegrations: '',
        securityRequirements: [],
        securityRequirementsOther: '',
        codeOwnership: '',
        sourceCodeDelivery: '',
        documentation: ''
      },
      instagramGrowthSpecific: {
        selectedServices: [],
        // Followers Growth fields
        accountHandle: '',
        targetFollowerCount: '',
        baselineFollowers: '',
        growthMethod: '',
        geographyTargeting: '',
        campaignStartDate: '',
        campaignEndDate: '',
        // Likes on Reels fields
        reelLinksLikes: [''],
        targetLikesPerReel: '',
        likesDeliveryDeadline: '',
        // Comments on Reels fields
        reelLinksComments: [''],
        targetCommentsCount: '',
        commentGuidelines: '',
        // Common attachments
        brandGuidelinesPdf: null,
        referenceContentFiles: []
      },
      instagramPromotionSpecific: {
        selectedServices: [],
        // Logo Promotion fields
        logoAssetFiles: [],
        logoPromotionPlacement: '',
        logoNumberOfPromotions: '',
        logoDuration: '',
        // Song Promotion fields
        songFileOrLink: '',
        songPromotionFormat: '',
        songNumberOfPromotions: '',
        songCampaignStartDate: '',
        songCampaignEndDate: '',
        // Story Promotion fields
        storyType: '',
        numberOfStories: '',
        storyDurationLive: '',
        swipeLinkCTA: '',
        // Repost Promotion fields
        originalPostLink: '',
        numberOfReposts: '',
        repostDurationLive: '',
        // Link Promotion fields
        channelHandle: '',
        numberOfLinkDrops: '',
        linkUrls: [''],
        expectedReachClicks: '',
        // Common attachments
        brandGuidelinesPdf: null,
        creativeAssetsZip: null
      },
      youtubePromotionSpecific: {
        channelUrl: '',
        promotionTypes: [],
        // Target fields (conditional)
        viewsTarget: '',
        subscribersTarget: '',
        likesTarget: '',
        commentsTarget: '',
        sharesTarget: '',
        // Common fields
        videoLinks: [''],
        campaignStartDate: '',
        campaignEndDate: '',
        geographyTargeting: '',
        promotionMethod: '',
        // Attachments
        brandGuidelinesPdf: null,
        contentRestrictionsPdf: null
      },
      influencerShoutoutSpecific: {
        platforms: [],
        instagramPromotionTypes: [],
        youtubePromotionTypes: [],
        // Instagram fields
        instagramReelCount: '',
        instagramReelDuration: '',
        instagramPostCount: '',
        instagramPostDuration: '',
        instagramStoryCount: '',
        instagramStoryDuration: '',
        linkInBioDuration: '',
        callToActionText: '',
        // YouTube fields
        youtubeShortsCount: '',
        youtubeShortsDuration: '',
        youtubeVideoCount: '',
        youtubeMentionDuration: '',
        youtubePinnedCommentCount: '',
        youtubePinnedDuration: '',
        // Campaign details
        campaignDuration: '',
        targetAudience: '',
        geographicTargeting: '',
        expectedReach: '',
        deliverablesTimeline: '',
        // Attachments
        brandGuidelinesPdf: null,
        creativeAssetsZip: null
      },
      gamingAccountSaleSpecific: {
        gameName: '',
        platform: '',
        accountLevel: '',
        accountRegion: '',
        newEmailForTransfer: '',
        specialConditions: '',
        screenshotFiles: [],
        referenceDocumentsPdf: null
      },
      ecommercePhysicalItemSpecific: {
        storeBrandName: '',
        productName: '',
        productType: '',
        productDetails: '',
        quantity: 1,
        itemPrice: '',
        deliveryAddress: '',
        deliveryDeadline: '',
        referenceImageFile: null,
        // Seller delivery fields (Phase 2)
        trackingId: '',
        courierProvider: '',
        dispatchDate: '',
        proofOfShipmentFiles: [],
        // Buyer confirmation fields (Phase 3)
        deliveryReceived: false,
        itemMatchesDescription: false,
        verificationPhotos: []
      }
    },
  });
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingData, setFundingData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    amount: ''
  });
  const [fundingLoading, setFundingLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('buyerToken');
    const data = localStorage.getItem('buyerData');

    if (!token || !data) {
      navigate('/buyer/auth');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setBuyerData(parsedData);
    } catch (error) {
      console.error('Error parsing buyer data:', error);
      navigate('/buyer/auth');
    }
  }, [navigate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCountryDropdown(false);
        setShowCurrencyDropdown(false);
        setShowPlatformDropdown(false);
        setShowServiceTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // If service type changes, reset product type in XBox
    if (name === 'serviceType') {
      setForm(prev => ({
        ...prev,
        scopeBox: { ...prev.scopeBox, productType: '' }
      }));
    }

    // Auto-select currency when country changes
    if (name === 'country' && value) {
      const defaultCurrency = countryCurrencyMap[value];
      if (defaultCurrency) {
        setForm(prev => ({
          ...prev,
          currency: defaultCurrency
        }));
      }
    }
  };
  const handleScopeInput = (e) => {
    setForm({ ...form, scopeBox: { ...form.scopeBox, [e.target.name]: e.target.value } });
  };

  // Get available product types based on selected service type
  const getAvailableProductTypes = () => {
    if (!form.serviceType) return [];
    return productTypeMapping[form.serviceType] || [];
  };

  // Check if logo design is selected
  const isLogoDesignSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Logo design';
  };

  // Check if poster/flyer/banner is selected
  const isPosterDesignSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Poster/flyer/banner design';
  };

  // Check if social media post creation is selected
  const isSocialPostSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Social media post creation';
  };

  // Check if video editing selected
  const isVideoEditingSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Video editing';
  };

  // Check if motion graphics selected
  const isMotionGraphicsSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Motion graphics';
  };

  // Check if NFT Art Creation selected
  const isNftArtSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'NFT art creation';
  };

  // Check if Illustration/Comics selected
  const isIllustrationSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === 'Illustration / Comics';
  };

  // Check if 3D Modeling/Rendering selected
  const is3dModelingSelected = () => {
    return form.serviceType === '🎨 Digital Creative Services' && form.scopeBox.productType === '3D modeling / rendering';
  };

  // Check if Website Development selected
  const isWebsiteDevelopmentSelected = () => {
    return form.serviceType === '💻 Freelance Development Services' && form.scopeBox.productType === 'Website development';
  };

  // Check if App Development selected
  const isAppDevelopmentSelected = () => {
    return form.serviceType === '💻 Freelance Development Services' && form.scopeBox.productType === 'App development';
  };

  // Check if Instagram Growth is selected
  const isInstagramGrowthSelected = () => {
    return form.serviceType === '📢 Social Media & Marketing Services' && form.scopeBox.productType === 'Instagram Growth';
  };

  // Check if Instagram Promotion is selected
  const isInstagramPromotionSelected = () => {
    return form.serviceType === '📢 Social Media & Marketing Services' && form.scopeBox.productType === 'Instagram Promotion';
  };

  // Check if YouTube Promotion is selected
  const isYouTubePromotionSelected = () => {
    return form.serviceType === '📢 Social Media & Marketing Services' && form.scopeBox.productType === 'YouTube promotion';
  };

  // Check if Influencer Shoutout is selected
  const isInfluencerShoutoutSelected = () => {
    return form.serviceType === '📢 Social Media & Marketing Services' && form.scopeBox.productType === 'Influencer shoutouts';
  };

  // Check if Gaming Account Sale is selected
  const isGamingAccountSaleSelected = () => {
    return form.serviceType === '🕹️ Gaming & Digital Goods' && form.scopeBox.productType === 'Gaming account sales';
  };

  // Check if E-Commerce Physical Item Escrow is selected
  const isEcommercePhysicalItemSelected = () => {
    return form.serviceType === '🛒 E-Commerce & Online Stores' && form.scopeBox.productType === 'Physical Item Escrow (No COD)';
  };

  // Handle logo-specific inputs
  const handleLogoInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        logoSpecific: {
          ...prev.scopeBox.logoSpecific,
          [name]: value
        }
      }
    }));
  };

  // Handle website development specific inputs
  const handleWebsiteInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        websiteDevelopmentSpecific: {
          ...prev.scopeBox.websiteDevelopmentSpecific,
          [name]: value
        }
      }
    }));
  };

  // Handle multi-select inputs for website development
  const handleWebsiteMultiSelect = (fieldName, value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.websiteDevelopmentSpecific[fieldName] || [];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          websiteDevelopmentSpecific: {
            ...prev.scopeBox.websiteDevelopmentSpecific,
            [fieldName]: newValues
          }
        }
      };
    });
  };

  // Handle app development inputs
  const handleAppInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        appDevelopmentSpecific: {
          ...prev.scopeBox.appDevelopmentSpecific,
          [name]: value
        }
      }
    }));
  };

  const handleAppMultiSelect = (fieldName, value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.appDevelopmentSpecific[fieldName] || [];
      const newValues = checked ? [...currentValues, value] : currentValues.filter(v => v !== value);
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          appDevelopmentSpecific: {
            ...prev.scopeBox.appDevelopmentSpecific,
            [fieldName]: newValues
          }
        }
      };
    });
  };

  // Handle Instagram Growth specific inputs
  const handleInstagramGrowthInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        instagramGrowthSpecific: {
          ...prev.scopeBox.instagramGrowthSpecific,
          [name]: value
        }
      }
    }));
  };

  // Handle reel links array updates
  const handleReelLinksUpdate = (type, index, value) => {
    setForm(prev => {
      const fieldName = type === 'likes' ? 'reelLinksLikes' : 'reelLinksComments';
      const currentLinks = [...prev.scopeBox.instagramGrowthSpecific[fieldName]];
      currentLinks[index] = value;

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramGrowthSpecific: {
            ...prev.scopeBox.instagramGrowthSpecific,
            [fieldName]: currentLinks
          }
        }
      };
    });
  };

  // Add new reel link input
  const addReelLink = (type) => {
    setForm(prev => {
      const fieldName = type === 'likes' ? 'reelLinksLikes' : 'reelLinksComments';
      const currentLinks = [...prev.scopeBox.instagramGrowthSpecific[fieldName]];
      currentLinks.push('');

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramGrowthSpecific: {
            ...prev.scopeBox.instagramGrowthSpecific,
            [fieldName]: currentLinks
          }
        }
      };
    });
  };

  // Remove reel link input
  const removeReelLink = (type, index) => {
    setForm(prev => {
      const fieldName = type === 'likes' ? 'reelLinksLikes' : 'reelLinksComments';
      const currentLinks = [...prev.scopeBox.instagramGrowthSpecific[fieldName]];
      currentLinks.splice(index, 1);

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramGrowthSpecific: {
            ...prev.scopeBox.instagramGrowthSpecific,
            [fieldName]: currentLinks
          }
        }
      };
    });
  };

  // Handle Instagram Growth multi-select services
  const handleInstagramGrowthMultiSelect = (value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.instagramGrowthSpecific.selectedServices || [];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramGrowthSpecific: {
            ...prev.scopeBox.instagramGrowthSpecific,
            selectedServices: newValues
          }
        }
      };
    });
  };

  // Handle Instagram Promotion specific inputs
  const handleInstagramPromotionInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        instagramPromotionSpecific: {
          ...prev.scopeBox.instagramPromotionSpecific,
          [name]: value
        }
      }
    }));
  };

  // Handle Instagram Promotion multi-select services
  const handleInstagramPromotionMultiSelect = (value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.instagramPromotionSpecific.selectedServices || [];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }

      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramPromotionSpecific: {
            ...prev.scopeBox.instagramPromotionSpecific,
            selectedServices: newValues
          }
        }
      };
    });
  };

  // Handle Instagram Promotion link URLs
  const handlePromotionLinkUrlsUpdate = (index, value) => {
    setForm(prev => {
      const currentLinks = [...prev.scopeBox.instagramPromotionSpecific.linkUrls];
      currentLinks[index] = value;
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramPromotionSpecific: {
            ...prev.scopeBox.instagramPromotionSpecific,
            linkUrls: currentLinks
          }
        }
      };
    });
  };

  const addPromotionLinkUrl = () => {
    setForm(prev => {
      const currentLinks = [...prev.scopeBox.instagramPromotionSpecific.linkUrls];
      currentLinks.push('');
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramPromotionSpecific: {
            ...prev.scopeBox.instagramPromotionSpecific,
            linkUrls: currentLinks
          }
        }
      };
    });
  };

  const removePromotionLinkUrl = (index) => {
    setForm(prev => {
      const currentLinks = [...prev.scopeBox.instagramPromotionSpecific.linkUrls];
      currentLinks.splice(index, 1);
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          instagramPromotionSpecific: {
            ...prev.scopeBox.instagramPromotionSpecific,
            linkUrls: currentLinks
          }
        }
      };
    });
  };

  // YouTube Promotion handlers
  const handleYouTubePromotionInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        youtubePromotionSpecific: {
          ...prev.scopeBox.youtubePromotionSpecific,
          [name]: value
        }
      }
    }));
  };

  const handleYouTubePromotionMultiSelect = (value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.youtubePromotionSpecific.promotionTypes || [];
      let newValues;
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          youtubePromotionSpecific: {
            ...prev.scopeBox.youtubePromotionSpecific,
            promotionTypes: newValues
          }
        }
      };
    });
  };

  const handleYouTubeVideoLinksUpdate = (index, value) => {
    setForm(prev => {
      const currentLinks = [...prev.scopeBox.youtubePromotionSpecific.videoLinks];
      currentLinks[index] = value;
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          youtubePromotionSpecific: {
            ...prev.scopeBox.youtubePromotionSpecific,
            videoLinks: currentLinks
          }
        }
      };
    });
  };

  const addYouTubeVideoLink = () => {
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        youtubePromotionSpecific: {
          ...prev.scopeBox.youtubePromotionSpecific,
          videoLinks: [...prev.scopeBox.youtubePromotionSpecific.videoLinks, '']
        }
      }
    }));
  };

  const removeYouTubeVideoLink = (index) => {
    setForm(prev => {
      const currentLinks = [...prev.scopeBox.youtubePromotionSpecific.videoLinks];
      currentLinks.splice(index, 1);
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          youtubePromotionSpecific: {
            ...prev.scopeBox.youtubePromotionSpecific,
            videoLinks: currentLinks
          }
        }
      };
    });
  };

  // Influencer Shoutout handlers
  const handleInfluencerShoutoutInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        influencerShoutoutSpecific: {
          ...prev.scopeBox.influencerShoutoutSpecific,
          [name]: value
        }
      }
    }));
  };

  const handleInfluencerShoutoutMultiSelect = (field, value, checked) => {
    setForm(prev => {
      const currentValues = prev.scopeBox.influencerShoutoutSpecific[field] || [];
      let newValues;
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }
      return {
        ...prev,
        scopeBox: {
          ...prev.scopeBox,
          influencerShoutoutSpecific: {
            ...prev.scopeBox.influencerShoutoutSpecific,
            [field]: newValues
          }
        }
      };
    });
  };

  // Gaming Account Sale handlers
  const handleGamingAccountSaleInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        gamingAccountSaleSpecific: {
          ...prev.scopeBox.gamingAccountSaleSpecific,
          [name]: value
        }
      }
    }));
  };

  // E-Commerce Physical Item Escrow handlers
  const handleEcommercePhysicalItemInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      scopeBox: {
        ...prev.scopeBox,
        ecommercePhysicalItemSpecific: {
          ...prev.scopeBox.ecommercePhysicalItemSpecific,
          [name]: type === 'checkbox' ? checked : value
        }
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Filter files based on selected type
    let allowedTypes;
    if (isLogoDesignSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.ai', '.eps'];
    } else if (isPosterDesignSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isSocialPostSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.mp4'];
    } else if (isVideoEditingSelected()) {
      allowedTypes = ['.mp4', '.mov', '.avi', '.mkv'];
    } else if (isMotionGraphicsSelected()) {
      // Allow all for motion graphics as requested
      allowedTypes = ['*'];
    } else if (isNftArtSelected()) {
      // Allow all for NFT art as requested
      allowedTypes = ['*'];
    } else if (isIllustrationSelected()) {
      // Allow all for illustration as requested
      allowedTypes = ['*'];
    } else if (is3dModelingSelected()) {
      // Allow 3D and image formats for 3D modeling
      allowedTypes = ['.obj', '.fbx', '.stl', '.blend', '.glb', '.jpg', '.jpeg', '.png', '.tiff', '.pdf', '.dwg'];
    } else if (isWebsiteDevelopmentSelected()) {
      // Allow common file types for website development
      allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.psd', '.ai', '.sketch', '.fig'];
    } else if (isAppDevelopmentSelected()) {
      // Allow only zip/rar/pdf/png/jpg/mp4 for app development; explicitly disallow APK/IPA
      allowedTypes = ['.zip', '.rar', '.pdf', '.png', '.jpg', '.mp4'];
    } else if (isInstagramGrowthSelected()) {
      // Allow only PDF, PNG, JPG, MP4 for Instagram growth services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4'];
    } else if (isInstagramPromotionSelected()) {
      // Allow common file types for Instagram promotion services
      allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.txt'];
    } else if (isYouTubePromotionSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for YouTube promotion services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isInfluencerShoutoutSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for Influencer Shoutout services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isGamingAccountSaleSelected()) {
      // Allow only PNG, JPG, PDF, TXT for Gaming Account Sale services
      allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.txt'];
    } else if (isEcommercePhysicalItemSelected()) {
      // Allow only PNG, JPG, PDF for E-Commerce Physical Item Escrow
      allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf'];
    } else {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.doc', '.docx', '.txt', '.zip', '.rar'];
    }

    const validFiles = files.filter(file => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return allowedTypes.includes(fileExtension);
    });

    if (validFiles.length !== files.length) {
      const invalidFiles = files.filter(file => {
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return !allowedTypes.includes(fileExtension);
      });
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Check file sizes (max 10MB per file)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    // Additional file type filtering for specific services
    let allowedTypes2;
    if (isLogoDesignSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.ai', '.eps'];
    } else if (isPosterDesignSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isSocialPostSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.psd', '.ai'];
    } else if (isVideoEditingSelected()) {
      allowedTypes2 = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.jpg', '.jpeg', '.png', '.pdf'];
    } else if (isMotionGraphicsSelected()) {
      allowedTypes2 = ['.mp4', '.mov', '.avi', '.gif', '.jpg', '.jpeg', '.png', '.pdf', '.psd', '.ai', '.ae'];
    } else if (isNftArtSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isIllustrationSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.psd', '.ai', '.sketch'];
    } else if (is3dModelingSelected()) {
      // Allow 3D and image formats for 3D modeling
      allowedTypes2 = ['.obj', '.fbx', '.stl', '.blend', '.glb', '.jpg', '.jpeg', '.png', '.tiff', '.pdf', '.dwg'];
    } else if (isWebsiteDevelopmentSelected()) {
      // Allow common file types for website development
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.psd', '.ai', '.sketch', '.fig'];
    } else if (isAppDevelopmentSelected()) {
      // Allow only zip/rar/pdf/png/jpg/mp4 for app development; explicitly disallow APK/IPA
      allowedTypes2 = ['.zip', '.rar', '.pdf', '.png', '.jpg', '.mp4'];
    } else if (isInstagramGrowthSelected()) {
      // Allow only PDF, PNG, JPG, MP4 for Instagram growth services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4'];
    } else if (isInstagramPromotionSelected()) {
      // Allow common file types for Instagram promotion services
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.txt'];
    } else if (isYouTubePromotionSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for YouTube promotion services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isInfluencerShoutoutSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for Influencer Shoutout services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isGamingAccountSaleSelected()) {
      // Allow only PNG, JPG, PDF, TXT for Gaming Account Sale services
      allowedTypes2 = ['.png', '.jpg', '.jpeg', '.pdf', '.txt'];
    } else {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.doc', '.docx', '.txt', '.zip', '.rar'];
    }

    const filteredFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(fileExtension);
    });

    const newFilePreviews = filteredFiles.map(f => ({ name: f.name, type: f.type, size: f.size }));

    // Combine with existing files, avoiding duplicates
    const existingNames = filePreviews.map(f => f.name);
    const uniqueNewFiles = newFilePreviews.filter(f => !existingNames.includes(f.name));

    const combinedFiles = [...filePreviews, ...uniqueNewFiles];
    setFilePreviews(combinedFiles);
    setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: combinedFiles } });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    // Filter files based on selected type
    let allowedTypes;
    if (isLogoDesignSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.ai', '.eps'];
    } else if (isPosterDesignSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isSocialPostSelected()) {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.mp4'];
    } else if (isVideoEditingSelected()) {
      allowedTypes = ['.mp4', '.mov', '.avi', '.mkv'];
    } else if (isMotionGraphicsSelected()) {
      allowedTypes = ['*'];
    } else if (isNftArtSelected()) {
      allowedTypes = ['*'];
    } else if (isIllustrationSelected()) {
      allowedTypes = ['*'];
    } else if (is3dModelingSelected()) {
      allowedTypes = ['.obj', '.fbx', '.stl', '.blend', '.glb', '.jpg', '.jpeg', '.png', '.tiff', '.pdf', '.dwg'];
    } else if (isWebsiteDevelopmentSelected()) {
      // Allow common file types for website development
      allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.psd', '.ai', '.sketch', '.fig'];
    } else if (isAppDevelopmentSelected()) {
      // Allow only zip/rar/pdf/png/jpg/mp4 for app development; explicitly disallow APK/IPA
      allowedTypes = ['.zip', '.rar', '.pdf', '.png', '.jpg', '.mp4'];
    } else if (isInstagramGrowthSelected()) {
      // Allow only PDF, PNG, JPG, MP4 for Instagram growth services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4'];
    } else if (isInstagramPromotionSelected()) {
      // Allow common file types for Instagram promotion services
      allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.txt'];
    } else if (isYouTubePromotionSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for YouTube promotion services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isInfluencerShoutoutSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for Influencer Shoutout services
      allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isGamingAccountSaleSelected()) {
      // Allow only PNG, JPG, PDF, TXT for Gaming Account Sale services
      allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.txt'];
    } else if (isEcommercePhysicalItemSelected()) {
      // Allow only PNG, JPG, PDF for E-Commerce Physical Item Escrow
      allowedTypes = ['.png', '.jpg', '.jpeg', '.pdf'];
    } else {
      allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.doc', '.docx', '.txt', '.zip', '.rar'];
    }

    const validFiles = files.filter(file => {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return allowedTypes.includes(fileExtension);
    });

    if (validFiles.length !== files.length) {
      const invalidFiles = files.filter(file => {
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return !allowedTypes.includes(fileExtension);
      });
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Check file sizes (max 10MB per file)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    // Additional file type filtering for specific services
    let allowedTypes2;
    if (isLogoDesignSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.ai', '.eps'];
    } else if (isPosterDesignSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isSocialPostSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.psd', '.ai'];
    } else if (isVideoEditingSelected()) {
      allowedTypes2 = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.jpg', '.jpeg', '.png', '.pdf'];
    } else if (isMotionGraphicsSelected()) {
      allowedTypes2 = ['.mp4', '.mov', '.avi', '.gif', '.jpg', '.jpeg', '.png', '.pdf', '.psd', '.ai', '.ae'];
    } else if (isNftArtSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.psd', '.ai'];
    } else if (isIllustrationSelected()) {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.psd', '.ai', '.sketch'];
    } else if (is3dModelingSelected()) {
      // Allow 3D and image formats for 3D modeling
      allowedTypes2 = ['.obj', '.fbx', '.stl', '.blend', '.glb', '.jpg', '.jpeg', '.png', '.tiff', '.pdf', '.dwg'];
    } else if (isWebsiteDevelopmentSelected()) {
      // Allow common file types for website development
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.psd', '.ai', '.sketch', '.fig'];
    } else if (isAppDevelopmentSelected()) {
      // Allow only zip/rar/pdf/png/jpg/mp4 for app development; explicitly disallow APK/IPA
      allowedTypes2 = ['.zip', '.rar', '.pdf', '.png', '.jpg', '.mp4'];
    } else if (isInstagramGrowthSelected()) {
      // Allow only PDF, PNG, JPG, MP4 for Instagram growth services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4'];
    } else if (isInstagramPromotionSelected()) {
      // Allow common file types for Instagram promotion services
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.txt'];
    } else if (isYouTubePromotionSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for YouTube promotion services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isInfluencerShoutoutSelected()) {
      // Allow only PDF, PNG, JPG, MP4, ZIP for Influencer Shoutout services
      allowedTypes2 = ['.pdf', '.png', '.jpg', '.jpeg', '.mp4', '.zip'];
    } else if (isGamingAccountSaleSelected()) {
      // Allow only PNG, JPG, PDF, TXT for Gaming Account Sale services
      allowedTypes2 = ['.png', '.jpg', '.jpeg', '.pdf', '.txt'];
    } else {
      allowedTypes2 = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.doc', '.docx', '.txt', '.zip', '.rar'];
    }

    const filteredFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(fileExtension);
    });

    const newFilePreviews = filteredFiles.map(f => ({ name: f.name, type: f.type, size: f.size }));

    // Combine with existing files, avoiding duplicates
    const existingNames = filePreviews.map(f => f.name);
    const uniqueNewFiles = newFilePreviews.filter(f => !existingNames.includes(f.name));

    const combinedFiles = [...filePreviews, ...uniqueNewFiles];
    setFilePreviews(combinedFiles);
    setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: combinedFiles } });
  };
  const handleDragOver = (e) => e.preventDefault();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPrice = (price, currency) => {
    if (!price) return 'Not set';
    const currencySymbol = currency || 'USD';
    return `${currencySymbol} ${parseFloat(price).toFixed(2)}`;
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'Not set';
    return new Date(deadline).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateStep1 = () => form.platform && form.sellerPlatformLink && form.serviceType && form.country && form.currency;
  const validateStep2 = () => {
    const baseValidation = form.scopeBox.title && form.scopeBox.productType && form.scopeBox.productLink && form.scopeBox.description && form.scopeBox.deadline && form.scopeBox.price && form.serviceType;

    // For logo design, validate logo-specific fields and skip condition
    if (isLogoDesignSelected()) {
      return baseValidation &&
        form.scopeBox.logoSpecific.businessName &&
        form.scopeBox.logoSpecific.keywordIndustry &&
        form.scopeBox.logoSpecific.logoStyle &&
        form.scopeBox.logoSpecific.colorPreferred;
    }

    // For poster design, validate poster-specific fields and skip condition
    if (isPosterDesignSelected()) {
      const p = form.scopeBox.posterSpecific;
      return baseValidation && p.width && p.height && p.resolution && p.orientation && p.textContent && p.brandColors && p.fonts && p.designStyle;
    }

    // For social post, validate social-post-specific fields and skip condition
    if (isSocialPostSelected()) {
      const s = form.scopeBox.socialPostSpecific;
      return baseValidation && s.postFormat && s.aspectRatio && s.resolution && s.postCount && s.finalCaption && s.hashtags;
    }

    // For video editing, validate video-specific fields and skip condition
    if (isVideoEditingSelected()) {
      const v = form.scopeBox.videoEditingSpecific;
      return baseValidation && v.duration && v.software && v.resolution && v.frameRate && v.format && v.audioTrack && v.videoCount && v.storyboard;
    }

    // For motion graphics, validate motion-specific fields and skip condition
    if (isMotionGraphicsSelected()) {
      const m = form.scopeBox.motionGraphicsSpecific;
      return baseValidation && m.animationStyle && m.duration && m.resolution && m.frameRate && m.format && m.audioRequired && m.textRequired;
    }

    // For NFT art, validate nft-specific fields and skip condition
    if (isNftArtSelected()) {
      const n = form.scopeBox.nftArtSpecific;
      return baseValidation && n.nftType && (n.nftType !== 'Other' ? true : !!n.nftTypeOther) && n.artworkStyle && (n.artworkStyle !== 'Other' ? true : !!n.artworkStyleOther) && n.resolution && (n.resolution !== 'Custom' ? true : !!n.resolutionCustom) && n.fileFormat && n.blockchain && (n.blockchain !== 'Other' ? true : !!n.blockchainOther) && n.metadataRequired && n.numberOfArtworks && n.ownershipTransfer;
    }

    // For illustration/comics, validate illustration-specific fields and skip condition
    if (isIllustrationSelected()) {
      const i = form.scopeBox.illustrationSpecific;
      return baseValidation && i.illustrationType && (i.illustrationType !== 'Other' ? true : !!i.illustrationTypeOther) && i.artworkStyle && (i.artworkStyle !== 'Other' ? true : !!i.artworkStyleOther) && i.numberOfPages && i.resolution && (i.resolution !== 'Custom' ? true : !!i.resolutionCustom) && i.fileFormat && i.colorOption && i.textRequired && (i.textRequired === 'Yes' ? !!i.scriptDialogue : true) && i.ownershipTransfer;
    }

    // For 3D modeling/rendering, validate 3d-specific fields and skip condition
    if (is3dModelingSelected()) {
      const m = form.scopeBox.model3dSpecific;
      return baseValidation && m.modelType && (m.modelType !== 'Other' ? true : !!m.modelTypeOther) && m.detailLevel && m.renderingQuality && m.fileFormat && (m.fileFormat !== 'Other' ? true : !!m.fileFormatOther) && m.textureRequired && (m.textureRequired === 'Yes' ? true : !!m.textureFormat) && m.animationRequired && (m.animationRequired === 'Yes' ? !!m.animationDuration : true) && m.numberOfViews && m.renderResolution && (m.renderResolution !== 'Custom' ? true : !!m.renderResolutionCustom) && m.ownershipTransfer;
    }

    // For website development, validate website-specific fields and skip condition
    if (isWebsiteDevelopmentSelected()) {
      const w = form.scopeBox.websiteDevelopmentSpecific;
      return baseValidation && w.websiteType && (w.websiteType !== 'Other' ? true : !!w.websiteTypeOther) && w.technologyStack.length > 0 && w.numberOfPages && w.responsiveDesign && w.browserCompatibility.length > 0 && w.hostingResponsibility && w.keyFeatures && w.adminPanel && w.thirdPartyIntegrations && w.securityRequirements.length > 0 && (w.securityRequirements.includes('Other') ? !!w.securityRequirementsOther : true) && w.codeOwnership && w.sourceCodeDelivery && w.documentation;
    }

    // For app development, validate app-specific fields and skip condition
    if (isAppDevelopmentSelected()) {
      const a = form.scopeBox.appDevelopmentSpecific;
      return baseValidation && a.appType && (a.appType !== 'Other' ? true : !!a.appTypeOther) && a.developmentFrameworks.length > 0 && a.targetOsVersions.length > 0 && a.numberOfScreens && a.offlineFunctionality && a.userAuthentication && a.backendResponsibility && a.keyFeatures && a.thirdPartyIntegrations && a.securityRequirements.length > 0 && (a.securityRequirements.includes('Other') ? !!a.securityRequirementsOther : true) && a.performanceTargets && a.sourceCodeDelivery && a.appStoreSubmission && a.documentation;
    }

    // For Instagram Growth, validate growth-specific fields and skip condition
    if (isInstagramGrowthSelected()) {
      const ig = form.scopeBox.instagramGrowthSpecific;
      const hasSelectedServices = ig.selectedServices.length > 0;

      let serviceValidation = true;

      // Validate Followers Growth fields if selected
      if (ig.selectedServices.includes('Followers Growth')) {
        serviceValidation = serviceValidation && ig.accountHandle && ig.targetFollowerCount && ig.baselineFollowers && ig.growthMethod && ig.geographyTargeting && ig.campaignStartDate && ig.campaignEndDate;
      }

      // Validate Likes on Reels fields if selected
      if (ig.selectedServices.includes('Likes on Reels')) {
        serviceValidation = serviceValidation && ig.reelLinksLikes.some(link => link.trim()) && ig.targetLikesPerReel && ig.likesDeliveryDeadline;
      }

      // Validate Comments on Reels fields if selected
      if (ig.selectedServices.includes('Comments on Reels')) {
        serviceValidation = serviceValidation && ig.reelLinksComments.some(link => link.trim()) && ig.targetCommentsCount && ig.commentGuidelines;
      }

      return baseValidation && hasSelectedServices && serviceValidation;
    }

    // For Gaming Account Sale, validate gaming-specific fields and skip condition
    if (isGamingAccountSaleSelected()) {
      const g = form.scopeBox.gamingAccountSaleSpecific;
      return baseValidation && g.gameName && g.platform && g.accountLevel && g.accountRegion && g.newEmailForTransfer;
    }

    // For E-Commerce Physical Item Escrow, validate e-commerce-specific fields and skip condition
    if (isEcommercePhysicalItemSelected()) {
      const e = form.scopeBox.ecommercePhysicalItemSpecific;
      return baseValidation && e.storeBrandName && e.productName && e.productType && e.productDetails && e.quantity && e.itemPrice && e.deliveryAddress && e.deliveryDeadline;
    }

    // For other services, validate condition field
    return baseValidation && form.scopeBox.condition;
  };
  const validateStep3 = () => form.sellerContact;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('buyerToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare the data for the API
      const orderData = {
        platform: form.platform,
        productLink: form.sellerPlatformLink, // Map to the expected backend field name
        serviceType: form.serviceType,
        country: form.country,
        currency: form.currency,
        sellerContact: form.sellerContact,
        scopeBox: {
          title: form.scopeBox.title,
          productType: form.scopeBox.productType,
          productLink: form.scopeBox.productLink,
          description: form.scopeBox.description,
          attachments: filePreviews.map(f => f.name), // Just send file names for now
          condition: form.scopeBox.condition,
          deadline: form.scopeBox.deadline,
          price: form.scopeBox.price,
          logoSpecific: isLogoDesignSelected() ? form.scopeBox.logoSpecific : null,
          posterSpecific: isPosterDesignSelected() ? form.scopeBox.posterSpecific : null,
          socialPostSpecific: isSocialPostSelected() ? form.scopeBox.socialPostSpecific : null,
          videoEditingSpecific: isVideoEditingSelected() ? form.scopeBox.videoEditingSpecific : null,
          motionGraphicsSpecific: isMotionGraphicsSelected() ? {
            ...form.scopeBox.motionGraphicsSpecific,
            // Strip File objects to names for transport (example simplification)
            storyboardPdf: form.scopeBox.motionGraphicsSpecific.storyboardPdf ? form.scopeBox.motionGraphicsSpecific.storyboardPdf.name : null,
            referenceFiles: (form.scopeBox.motionGraphicsSpecific.referenceFiles || []).map(f => f.name),
            brandGuidelinesPdf: form.scopeBox.motionGraphicsSpecific.brandGuidelinesPdf ? form.scopeBox.motionGraphicsSpecific.brandGuidelinesPdf.name : null,
          } : null,
          nftArtSpecific: isNftArtSelected() ? {
            ...form.scopeBox.nftArtSpecific,
            refMoodboardFiles: (form.scopeBox.nftArtSpecific.refMoodboardFiles || []).map(f => f.name),
            styleGuidePdf: form.scopeBox.nftArtSpecific.styleGuidePdf ? form.scopeBox.nftArtSpecific.styleGuidePdf.name : null,
            metadataTemplate: form.scopeBox.nftArtSpecific.metadataTemplate ? form.scopeBox.nftArtSpecific.metadataTemplate.name : null,
          } : null,
          illustrationSpecific: isIllustrationSelected() ? {
            ...form.scopeBox.illustrationSpecific,
            refArtworkFiles: (form.scopeBox.illustrationSpecific.refArtworkFiles || []).map(f => f.name),
            scriptStoryboard: form.scopeBox.illustrationSpecific.scriptStoryboard ? form.scopeBox.illustrationSpecific.scriptStoryboard.name : null,
            guidelinesPdf: form.scopeBox.illustrationSpecific.guidelinesPdf ? form.scopeBox.illustrationSpecific.guidelinesPdf.name : null,
          } : null,
          model3dSpecific: is3dModelingSelected() ? {
            ...form.scopeBox.model3dSpecific,
            refModelFiles: (form.scopeBox.model3dSpecific.refModelFiles || []).map(f => f.name),
            technicalDrawings: form.scopeBox.model3dSpecific.technicalDrawings ? form.scopeBox.model3dSpecific.technicalDrawings.name : null,
            guidelinesPdf: form.scopeBox.model3dSpecific.guidelinesPdf ? form.scopeBox.model3dSpecific.guidelinesPdf.name : null,
          } : null,
          appDevelopmentSpecific: isAppDevelopmentSelected() ? {
            ...form.scopeBox.appDevelopmentSpecific,
            uiuxMockups: (form.scopeBox.appDevelopmentSpecific.uiuxMockups || []).map(f => f.name),
            guidelines: form.scopeBox.appDevelopmentSpecific.guidelines ? form.scopeBox.appDevelopmentSpecific.guidelines.name : null,
          } : null,
          websiteDevelopmentSpecific: isWebsiteDevelopmentSelected() ? {
            ...form.scopeBox.websiteDevelopmentSpecific,
            wireframes: (form.scopeBox.websiteDevelopmentSpecific.wireframes || []).map(f => f.name),
            guidelines: form.scopeBox.websiteDevelopmentSpecific.guidelines ? form.scopeBox.websiteDevelopmentSpecific.guidelines.name : null,
          } : null,
          instagramGrowthSpecific: isInstagramGrowthSelected() ? {
            ...form.scopeBox.instagramGrowthSpecific,
            brandGuidelinesPdf: form.scopeBox.instagramGrowthSpecific.brandGuidelinesPdf ? form.scopeBox.instagramGrowthSpecific.brandGuidelinesPdf.name : null,
            referenceContentFiles: (form.scopeBox.instagramGrowthSpecific.referenceContentFiles || []).map(f => f.name),
          } : null,
          instagramPromotionSpecific: isInstagramPromotionSelected() ? {
            ...form.scopeBox.instagramPromotionSpecific,
            logoAssetFiles: (form.scopeBox.instagramPromotionSpecific.logoAssetFiles || []).map(f => f.name),
            brandGuidelinesPdf: form.scopeBox.instagramPromotionSpecific.brandGuidelinesPdf ? form.scopeBox.instagramPromotionSpecific.brandGuidelinesPdf.name : null,
            creativeAssetsZip: form.scopeBox.instagramPromotionSpecific.creativeAssetsZip ? form.scopeBox.instagramPromotionSpecific.creativeAssetsZip.name : null,
          } : null,
          youtubePromotionSpecific: isYouTubePromotionSelected() ? {
            ...form.scopeBox.youtubePromotionSpecific,
            brandGuidelinesPdf: form.scopeBox.youtubePromotionSpecific.brandGuidelinesPdf ? form.scopeBox.youtubePromotionSpecific.brandGuidelinesPdf.name : null,
            contentRestrictionsPdf: form.scopeBox.youtubePromotionSpecific.contentRestrictionsPdf ? form.scopeBox.youtubePromotionSpecific.contentRestrictionsPdf.name : null,
          } : null,
          influencerShoutoutSpecific: isInfluencerShoutoutSelected() ? {
            ...form.scopeBox.influencerShoutoutSpecific,
            brandGuidelinesPdf: form.scopeBox.influencerShoutoutSpecific.brandGuidelinesPdf ? form.scopeBox.influencerShoutoutSpecific.brandGuidelinesPdf.name : null,
            creativeAssetsZip: form.scopeBox.influencerShoutoutSpecific.creativeAssetsZip ? form.scopeBox.influencerShoutoutSpecific.creativeAssetsZip.name : null,
          } : null,
          gamingAccountSaleSpecific: isGamingAccountSaleSelected() ? {
            ...form.scopeBox.gamingAccountSaleSpecific,
            screenshotFiles: (form.scopeBox.gamingAccountSaleSpecific.screenshotFiles || []).map(f => f.name),
            referenceDocumentsPdf: form.scopeBox.gamingAccountSaleSpecific.referenceDocumentsPdf ? form.scopeBox.gamingAccountSaleSpecific.referenceDocumentsPdf.name : null,
          } : null,
          ecommercePhysicalItemSpecific: isEcommercePhysicalItemSelected() ? {
            ...form.scopeBox.ecommercePhysicalItemSpecific,
            referenceImageFile: form.scopeBox.ecommercePhysicalItemSpecific.referenceImageFile ? form.scopeBox.ecommercePhysicalItemSpecific.referenceImageFile.name : null,
            proofOfShipmentFiles: (form.scopeBox.ecommercePhysicalItemSpecific.proofOfShipmentFiles || []).map(f => f.name),
            verificationPhotos: (form.scopeBox.ecommercePhysicalItemSpecific.verificationPhotos || []).map(f => f.name),
          } : null,
        }
      };

      const response = await axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setOrderData(response.data.data);
        setFundingData(prev => ({ ...prev, amount: response.data.data.price }));
        setShowFundingModal(true);
      } else {
        setError(response.data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/auth');
        return;
      }
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFundingSubmit = async (e) => {
    e.preventDefault();
    setFundingLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fund the escrow
      const token = localStorage.getItem('buyerToken');
      const fundResponse = await axios.post(`/api/orders/${orderData.orderId}/fund-escrow`, {
        buyerId: buyerData.id,
        paymentMethod: 'credit_card',
        amount: fundingData.amount,
        cardDetails: {
          cardNumber: '4111111111111111', // Demo card number
          expiryMonth: '12',
          expiryYear: '2026',
          cvv: '123'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (fundResponse.data.success) {
        setShowFundingModal(false);
        setShowSuccess(true);

        // Redirect to order tracking page after 3 seconds
        setTimeout(() => {
          navigate(`/buyer/order/${orderData.orderId}`);
        }, 3000);
      } else {
        setError('Failed to fund escrow. Please try again.');
      }
    } catch (error) {
      console.error('Error funding escrow:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Payment failed. Please check your card details and try again.');
      }
    } finally {
      setFundingLoading(false);
    }
  };

  const handleFundingInput = (e) => {
    const { name, value } = e.target;
    setFundingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show loading if buyer data is not loaded yet
  if (!buyerData) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-inter text-lg">Loading buyer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <div className="relative z-10 flex flex-col items-center py-6 px-4 sm:py-10">
        {/* Header */}
        <div className="w-full max-w-3xl mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                window.location.href = '/buyer/dashboard';
              }}
              className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium font-inter transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-navy-900 font-inter tracking-tight">Create New Order</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          {/* Welcome Message */}
          <div className="mt-6 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
            <p className="text-sm text-neutral-600 font-inter">
              Welcome, <span className="font-semibold text-navy-900">{buyerData.firstName} {buyerData.lastName}</span>!
              Create a new escrow order to protect your payment.
            </p>
          </div>
        </div>

        <div className="w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl shadow-elevation p-6 sm:p-10 animate-fadeIn">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 relative">
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter font-medium ${step >= 1 ? 'text-indigo-600' : 'text-neutral-400'}`}>Order Details</div>
            <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-neutral-200'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter font-medium ${step >= 2 ? 'text-indigo-600' : 'text-neutral-400'}`}>XBox</div>
            <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-neutral-200'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter font-medium ${step >= 3 ? 'text-indigo-600' : 'text-neutral-400'}`}>Seller</div>
            <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full ${step >= 4 ? 'bg-indigo-600' : 'bg-neutral-200'}`} />
            <div className={`flex-1 text-center text-xs sm:text-sm font-inter font-medium ${step === 4 ? 'text-indigo-600' : 'text-neutral-400'}`}>Confirm</div>
          </div>

          {/* Step 1: Order Details */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Custom Platform Dropdown */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 text-left font-inter flex justify-between items-center shadow-sm"
                >
                  <span className={form.platform ? 'text-navy-900 font-medium' : 'text-neutral-400'}>
                    {form.platform || 'Platform'}
                  </span>
                  <svg className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${showPlatformDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPlatformDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-elevation max-h-60 overflow-y-auto">
                    {platforms.map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({ ...prev, platform }));
                          setShowPlatformDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-200 font-inter ${form.platform === platform ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-navy-900'
                          }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input name="sellerPlatformLink" value={form.sellerPlatformLink} onChange={handleInput} placeholder="Enter seller's profile link, username, or phone number" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
              {/* Custom Type of Service Dropdown */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowServiceTypeDropdown(!showServiceTypeDropdown)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 text-left font-inter flex justify-between items-center shadow-sm"
                >
                  <span className={form.serviceType ? 'text-navy-900 font-medium' : 'text-neutral-400'}>
                    {form.serviceType || 'Type of Service'}
                  </span>
                  <svg className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${showServiceTypeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showServiceTypeDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-elevation max-h-60 overflow-y-auto">
                    {serviceTypes.map(serviceType => (
                      <button
                        key={serviceType}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            serviceType,
                            scopeBox: { ...prev.scopeBox, productType: '' }
                          }));
                          setShowServiceTypeDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-200 font-inter ${form.serviceType === serviceType ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-navy-900'
                          }`}
                      >
                        {serviceType}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Custom Country Dropdown */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 text-left font-inter flex justify-between items-center shadow-sm"
                >
                  <span className={form.country ? 'text-navy-900 font-medium' : 'text-neutral-400'}>
                    {form.country || 'Select Country'}
                  </span>
                  <svg className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCountryDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-elevation max-h-60 overflow-y-auto">
                    {countries.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          const defaultCurrency = countryCurrencyMap[country];
                          setForm(prev => ({
                            ...prev,
                            country,
                            currency: defaultCurrency || prev.currency
                          }));
                          setShowCountryDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-200 font-inter ${form.country === country ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-navy-900'
                          }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Custom Currency Dropdown */}
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 text-left font-inter flex justify-between items-center shadow-sm"
                >
                  <span className={form.currency ? 'text-navy-900 font-medium' : 'text-neutral-400'}>
                    {form.currency || 'Select Currency'}
                  </span>
                  <svg className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${showCurrencyDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCurrencyDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-elevation max-h-60 overflow-y-auto">
                    {currencies.map(currency => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({ ...prev, currency }));
                          setShowCurrencyDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors duration-200 font-inter ${form.currency === currency ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-navy-900'
                          }`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  className="btn btn-primary px-8 py-3 w-full sm:w-auto text-base group"
                  disabled={!validateStep1()}
                  onClick={() => setStep(2)}
                >
                  <span className="flex items-center">
                    Next
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: XBox */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Service Type Dependency Notice */}
              {!form.serviceType && (
                <div className="p-3 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300 font-inter">
                    ⚠️ Please go back to Step 1 and select a "Type of Service" to enable Product Type selection.
                  </p>
                </div>
              )}
              <input
                name="title"
                value={form.scopeBox.title}
                onChange={handleScopeInput}
                placeholder="Project Title"
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                required
              />
              <select name="productType" value={form.scopeBox.productType} onChange={handleScopeInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required disabled={!form.serviceType}>
                <option value="" className="text-neutral-400">
                  {!form.serviceType ? 'Please select Type of Service first' : 'Product Type'}
                </option>
                {getAvailableProductTypes().map(pt => <option key={pt} value={pt} className="text-navy-900">{pt}</option>)}
              </select>
              <input name="productLink" value={form.scopeBox.productLink} onChange={handleScopeInput} placeholder="Product Link" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
              <textarea name="description" value={form.scopeBox.description} onChange={handleScopeInput} placeholder="Description / Requirements" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm min-h-[80px] resize-none" required />

              {/* Logo Specific Module */}
              {isLogoDesignSelected() && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎨</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Logo Specific Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      name="businessName"
                      value={form.scopeBox.logoSpecific.businessName}
                      onChange={handleLogoInput}
                      placeholder="Business Name"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <input
                      name="keywordIndustry"
                      value={form.scopeBox.logoSpecific.keywordIndustry}
                      onChange={handleLogoInput}
                      placeholder="Keyword / Industry"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="logoStyle"
                      value={form.scopeBox.logoSpecific.logoStyle}
                      onChange={handleLogoInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Logo Style</option>
                      {logoStyles.map(style => <option key={style} value={style} className="text-navy-900">{style}</option>)}
                    </select>
                    <input
                      name="colorPreferred"
                      value={form.scopeBox.logoSpecific.colorPreferred}
                      onChange={handleLogoInput}
                      placeholder="Color Preferred (e.g., #FF0000 or 'Blue, Red')"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Social Media Post Specific Module */}
              {isSocialPostSelected() && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📱</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Social Media Post Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="postFormat"
                      value={form.scopeBox.socialPostSpecific.postFormat}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, postFormat: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Post Format</option>
                      {socialFormats.map(f => <option key={f} value={f} className="text-navy-900">{f}</option>)}
                    </select>
                    <select
                      name="aspectRatio"
                      value={form.scopeBox.socialPostSpecific.aspectRatio}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, aspectRatio: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Aspect Ratio</option>
                      {socialAspectRatios.map(a => <option key={a} value={a} className="text-navy-900">{a}</option>)}
                    </select>
                    <select
                      name="resolution"
                      value={form.scopeBox.socialPostSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, resolution: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {socialResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <input
                      type="number"
                      name="postCount"
                      value={form.scopeBox.socialPostSpecific.postCount}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, postCount: e.target.value } } }))}
                      placeholder="Post Count"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <textarea
                      name="finalCaption"
                      value={form.scopeBox.socialPostSpecific.finalCaption}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, finalCaption: e.target.value } } }))}
                      placeholder="Final Caption/Text (exact wording)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm min-h-[80px] resize-none"
                      required
                    />
                    <textarea
                      name="hashtags"
                      value={form.scopeBox.socialPostSpecific.hashtags}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, socialPostSpecific: { ...prev.scopeBox.socialPostSpecific, hashtags: e.target.value } } }))}
                      placeholder="#hashtags list"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm min-h-[80px] resize-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Instagram Growth Specific Module */}
              {isInstagramGrowthSelected() && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📈</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Instagram Growth Details</h3>
                  </div>

                  {/* Growth Goals Section */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Growth Goals</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {instagramGrowthServices.map(service => (
                        <label key={service} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                          <input
                            type="checkbox"
                            checked={form.scopeBox.instagramGrowthSpecific.selectedServices.includes(service)}
                            onChange={(e) => handleInstagramGrowthMultiSelect(service, e.target.checked)}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-medium">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Fields Based on Selected Services */}
                  {form.scopeBox.instagramGrowthSpecific.selectedServices.includes('Followers Growth') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Followers Growth Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          name="accountHandle"
                          value={form.scopeBox.instagramGrowthSpecific.accountHandle}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Account Handle / IG User ID"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="number"
                          name="targetFollowerCount"
                          value={form.scopeBox.instagramGrowthSpecific.targetFollowerCount}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Target Follower Count"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="number"
                          name="baselineFollowers"
                          value={form.scopeBox.instagramGrowthSpecific.baselineFollowers}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Baseline Followers (current count)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <select
                          name="growthMethod"
                          value={form.scopeBox.instagramGrowthSpecific.growthMethod}
                          onChange={handleInstagramGrowthInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        >
                          <option value="" className="text-neutral-400">Growth Method</option>
                          {growthMethods.map(method => <option key={method} value={method} className="text-navy-900">{method}</option>)}
                        </select>
                        <textarea
                          name="geographyTargeting"
                          value={form.scopeBox.instagramGrowthSpecific.geographyTargeting}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Geography / Audience Targeting"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm min-h-[80px] resize-none sm:col-span-2"
                          required
                        />
                        <input
                          type="date"
                          name="campaignStartDate"
                          value={form.scopeBox.instagramGrowthSpecific.campaignStartDate}
                          onChange={handleInstagramGrowthInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="date"
                          name="campaignEndDate"
                          value={form.scopeBox.instagramGrowthSpecific.campaignEndDate}
                          onChange={handleInstagramGrowthInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramGrowthSpecific.selectedServices.includes('Likes on Reels') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Likes on Reels Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm text-navy-900 font-inter mb-2">Reel Link(s)</label>
                          {form.scopeBox.instagramGrowthSpecific.reelLinksLikes.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="url"
                                value={link}
                                onChange={(e) => handleReelLinksUpdate('likes', index, e.target.value)}
                                placeholder="https://instagram.com/reel/..."
                                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                                required
                              />
                              {form.scopeBox.instagramGrowthSpecific.reelLinksLikes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeReelLink('likes', index)}
                                  className="px-3 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-200"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addReelLink('likes')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium font-inter transition-colors"
                          >
                            + Add Another Reel Link
                          </button>
                        </div>
                        <input
                          type="number"
                          name="targetLikesPerReel"
                          value={form.scopeBox.instagramGrowthSpecific.targetLikesPerReel}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Target Likes per Reel"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="datetime-local"
                          name="likesDeliveryDeadline"
                          value={form.scopeBox.instagramGrowthSpecific.likesDeliveryDeadline}
                          onChange={handleInstagramGrowthInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramGrowthSpecific.selectedServices.includes('Comments on Reels') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Comments on Reels Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm text-navy-900 font-inter mb-2">Reel Link(s)</label>
                          {form.scopeBox.instagramGrowthSpecific.reelLinksComments.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="url"
                                value={link}
                                onChange={(e) => handleReelLinksUpdate('comments', index, e.target.value)}
                                placeholder="https://instagram.com/reel/..."
                                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                                required
                              />
                              {form.scopeBox.instagramGrowthSpecific.reelLinksComments.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeReelLink('comments', index)}
                                  className="px-3 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-200"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addReelLink('comments')}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium font-inter transition-colors"
                          >
                            + Add Another Reel Link
                          </button>
                        </div>
                        <input
                          type="number"
                          name="targetCommentsCount"
                          value={form.scopeBox.instagramGrowthSpecific.targetCommentsCount}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Target Number of Comments"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <textarea
                          name="commentGuidelines"
                          value={form.scopeBox.instagramGrowthSpecific.commentGuidelines}
                          onChange={handleInstagramGrowthInput}
                          placeholder="Comment Guidelines (acceptable style, tone, or keywords)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm min-h-[80px] resize-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Attachments Section */}
                  {form.scopeBox.instagramGrowthSpecific.selectedServices.length > 0 && (
                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Attachments</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Brand Guidelines (PDF upload)</label>
                          <input
                            type="file"
                            accept=".pdf"
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, instagramGrowthSpecific: { ...prev.scopeBox.instagramGrowthSpecific, brandGuidelinesPdf: e.target.files?.[0] || null } } }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Reference Content (JPG, PNG, MP4 upload)</label>
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.mp4"
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, instagramGrowthSpecific: { ...prev.scopeBox.instagramGrowthSpecific, referenceContentFiles: Array.from(e.target.files || []) } } }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Instagram Promotion Specific Module */}
              {isInstagramPromotionSelected() && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📢</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Instagram Promotion Details</h3>
                  </div>

                  {/* Promotion Goals Section */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Promotion Goals</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {instagramPromotionServices.map(service => (
                        <label key={service} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                          <input
                            type="checkbox"
                            checked={form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes(service) || false}
                            onChange={(e) => handleInstagramPromotionMultiSelect(service, e.target.checked)}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-medium">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Fields Based on Selected Services */}
                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes('Logo Promotion') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Logo Promotion Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Logo Asset Upload (PNG, JPG, SVG)</label>
                          <input
                            type="file"
                            multiple
                            accept=".png,.jpg,.jpeg,.svg"
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, instagramPromotionSpecific: { ...prev.scopeBox.instagramPromotionSpecific, logoAssetFiles: Array.from(e.target.files || []) } } }))}
                          />
                        </div>
                        <select
                          name="logoPromotionPlacement"
                          value={form.scopeBox.instagramPromotionSpecific.logoPromotionPlacement}
                          onChange={handleInstagramPromotionInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        >
                          <option value="" className="text-neutral-400">Promotion Placement</option>
                          {logoPromotionPlacements.map(placement => <option key={placement} value={placement} className="text-navy-900">{placement}</option>)}
                        </select>
                        <input
                          type="number"
                          name="logoNumberOfPromotions"
                          value={form.scopeBox.instagramPromotionSpecific.logoNumberOfPromotions}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Number of Promotions"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          name="logoDuration"
                          value={form.scopeBox.instagramPromotionSpecific.logoDuration}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Duration (hours/days live)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes('Song Promotion') && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="text-md font-semibold text-red-300 font-inter mb-3">Song Promotion Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          name="songFileOrLink"
                          value={form.scopeBox.instagramPromotionSpecific.songFileOrLink}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Song File or Link (MP3, WAV, Spotify/YouTube link)"
                          className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter sm:col-span-2"
                          required
                        />
                        <select
                          name="songPromotionFormat"
                          value={form.scopeBox.instagramPromotionSpecific.songPromotionFormat}
                          onChange={handleInstagramPromotionInput}
                          className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                          required
                        >
                          <option value="" className="text-white bg-slate-800">Promotion Format</option>
                          {songPromotionFormats.map(format => <option key={format} value={format} className="text-white bg-slate-800">{format}</option>)}
                        </select>
                        <input
                          type="number"
                          name="songNumberOfPromotions"
                          value={form.scopeBox.instagramPromotionSpecific.songNumberOfPromotions}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Number of Promotions"
                          className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                          required
                        />
                        <input
                          type="date"
                          name="songCampaignStartDate"
                          value={form.scopeBox.instagramPromotionSpecific.songCampaignStartDate}
                          onChange={handleInstagramPromotionInput}
                          className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                          required
                        />
                        <input
                          type="date"
                          name="songCampaignEndDate"
                          value={form.scopeBox.instagramPromotionSpecific.songCampaignEndDate}
                          onChange={handleInstagramPromotionInput}
                          className="w-full px-4 py-3 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 font-inter"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes('Story Promotion') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Story Promotion Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select
                          name="storyType"
                          value={form.scopeBox.instagramPromotionSpecific.storyType}
                          onChange={handleInstagramPromotionInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        >
                          <option value="" className="text-neutral-400">Story Type</option>
                          {storyTypes.map(type => <option key={type} value={type} className="text-navy-900">{type}</option>)}
                        </select>
                        <input
                          type="number"
                          name="numberOfStories"
                          value={form.scopeBox.instagramPromotionSpecific.numberOfStories}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Number of Stories"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          name="storyDurationLive"
                          value={form.scopeBox.instagramPromotionSpecific.storyDurationLive}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Duration Each Story Must Stay Live (hours)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="url"
                          name="swipeLinkCTA"
                          value={form.scopeBox.instagramPromotionSpecific.swipeLinkCTA}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Swipe Link / CTA (URL)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes('Repost Promotion') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Repost Promotion Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="url"
                          name="originalPostLink"
                          value={form.scopeBox.instagramPromotionSpecific.originalPostLink}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Original Post Link (URL)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm sm:col-span-2"
                          required
                        />
                        <input
                          type="number"
                          name="numberOfReposts"
                          value={form.scopeBox.instagramPromotionSpecific.numberOfReposts}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Number of Reposts"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          name="repostDurationLive"
                          value={form.scopeBox.instagramPromotionSpecific.repostDurationLive}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Duration to Stay Live (hours/days)"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.includes('Link Promotion (via Broadcast Channel)') && (
                    <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                      <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">Link Promotion Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          name="channelHandle"
                          value={form.scopeBox.instagramPromotionSpecific.channelHandle}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Channel Handle"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="number"
                          name="numberOfLinkDrops"
                          value={form.scopeBox.instagramPromotionSpecific.numberOfLinkDrops}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Number of Link Drops"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <div className="sm:col-span-2">
                          <label className="block text-sm text-navy-900 font-inter mb-2">Link URL(s)</label>
                          {form.scopeBox.instagramPromotionSpecific.linkUrls.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <input
                                type="url"
                                value={link}
                                onChange={(e) => handlePromotionLinkUrlsUpdate(index, e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                                required
                              />
                              {form.scopeBox.instagramPromotionSpecific.linkUrls.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePromotionLinkUrl(index)}
                                  className="px-3 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-200"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addPromotionLinkUrl}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium font-inter transition-colors"
                          >
                            + Add Another Link URL
                          </button>
                        </div>
                        <input
                          type="number"
                          name="expectedReachClicks"
                          value={form.scopeBox.instagramPromotionSpecific.expectedReachClicks}
                          onChange={handleInstagramPromotionInput}
                          placeholder="Expected Reach/Clicks"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm sm:col-span-2"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Common Attachments Section */}
                  {form.scopeBox.instagramPromotionSpecific?.selectedServices?.length > 0 && (
                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Attachments</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Brand Guidelines (PDF upload)</label>
                          <input
                            type="file"
                            accept=".pdf"
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, instagramPromotionSpecific: { ...prev.scopeBox.instagramPromotionSpecific, brandGuidelinesPdf: e.target.files?.[0] || null } } }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Creative Assets (ZIP of images/videos)</label>
                          <input
                            type="file"
                            accept=".zip"
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, instagramPromotionSpecific: { ...prev.scopeBox.instagramPromotionSpecific, creativeAssetsZip: e.target.files?.[0] || null } } }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* YouTube Promotion Specific Module */}
              {isYouTubePromotionSelected() && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📺</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">YouTube Promotion Details</h3>
                  </div>

                  {/* Channel URL / ID */}
                  <div className="mb-6">
                    <input
                      name="channelUrl"
                      value={form.scopeBox.youtubePromotionSpecific.channelUrl}
                      onChange={handleYouTubePromotionInput}
                      placeholder="Channel URL / ID"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                  </div>

                  {/* Promotion Type Checkboxes */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Promotion Type</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {youtubePromotionTypes.map(type => (
                        <label key={type} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                          <input
                            type="checkbox"
                            checked={form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes(type) || false}
                            onChange={(e) => handleYouTubePromotionMultiSelect(type, e.target.checked)}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Target Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes('Views') && (
                      <input
                        type="number"
                        name="viewsTarget"
                        value={form.scopeBox.youtubePromotionSpecific.viewsTarget}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Views Target"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}

                    {form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes('Subscribers') && (
                      <input
                        type="number"
                        name="subscribersTarget"
                        value={form.scopeBox.youtubePromotionSpecific.subscribersTarget}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Subscribers Target"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}

                    {form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes('Likes') && (
                      <input
                        type="number"
                        name="likesTarget"
                        value={form.scopeBox.youtubePromotionSpecific.likesTarget}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Likes Target"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}

                    {form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes('Comments') && (
                      <input
                        type="number"
                        name="commentsTarget"
                        value={form.scopeBox.youtubePromotionSpecific.commentsTarget}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Comments Target"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}

                    {form.scopeBox.youtubePromotionSpecific?.promotionTypes?.includes('Shares') && (
                      <input
                        type="number"
                        name="sharesTarget"
                        value={form.scopeBox.youtubePromotionSpecific.sharesTarget}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Shares Target"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                  </div>

                  {/* Common Fields */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-white/90 font-inter mb-3">Campaign Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Video Links */}
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-2">Video Link(s)</label>
                        {form.scopeBox.youtubePromotionSpecific.videoLinks.map((link, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="url"
                              value={link}
                              onChange={(e) => handleYouTubeVideoLinksUpdate(index, e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                              required
                            />
                            {form.scopeBox.youtubePromotionSpecific.videoLinks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeYouTubeVideoLink(index)}
                                className="px-3 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-200"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addYouTubeVideoLink}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium font-inter transition-colors"
                        >
                          + Add Another Video Link
                        </button>
                      </div>

                      {/* Campaign Duration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="date"
                          name="campaignStartDate"
                          value={form.scopeBox.youtubePromotionSpecific.campaignStartDate}
                          onChange={handleYouTubePromotionInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          type="date"
                          name="campaignEndDate"
                          value={form.scopeBox.youtubePromotionSpecific.campaignEndDate}
                          onChange={handleYouTubePromotionInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>

                      {/* Geography / Audience Targeting */}
                      <textarea
                        name="geographyTargeting"
                        value={form.scopeBox.youtubePromotionSpecific.geographyTargeting}
                        onChange={handleYouTubePromotionInput}
                        placeholder="Geography / Audience Targeting (e.g., US, UK, Age 18-35, Gaming audience)"
                        rows={3}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter resize-none shadow-sm"
                        required
                      />

                      {/* Promotion Method */}
                      <select
                        name="promotionMethod"
                        value={form.scopeBox.youtubePromotionSpecific.promotionMethod}
                        onChange={handleYouTubePromotionInput}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      >
                        <option value="" className="text-neutral-400">Promotion Method</option>
                        {promotionMethods.map(method => <option key={method} value={method} className="text-navy-900">{method}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Attachment Fields */}
                  <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Brand Guidelines (PDF upload)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, youtubePromotionSpecific: { ...prev.scopeBox.youtubePromotionSpecific, brandGuidelinesPdf: e.target.files?.[0] || null } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Content Restrictions (PDF/TXT upload)</label>
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, youtubePromotionSpecific: { ...prev.scopeBox.youtubePromotionSpecific, contentRestrictionsPdf: e.target.files?.[0] || null } } }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Influencer Shoutout Promotion Specific Module */}
              {isInfluencerShoutoutSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📢</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Influencer Shoutout Promotion</h3>
                  </div>

                  {/* Platform Selection */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Platform Selection</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {influencerPlatforms.map(platform => (
                        <label key={platform} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                          <input
                            type="checkbox"
                            checked={form.scopeBox.influencerShoutoutSpecific?.platforms?.includes(platform) || false}
                            onChange={(e) => handleInfluencerShoutoutMultiSelect('platforms', platform, e.target.checked)}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-medium">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Instagram Promotion Types */}
                  {(form.scopeBox.influencerShoutoutSpecific?.platforms?.includes('Instagram') || form.scopeBox.influencerShoutoutSpecific?.platforms?.includes('Both')) && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Instagram Promotion Types</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {instagramPromotionTypes.map(type => (
                          <label key={type} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                            <input
                              type="checkbox"
                              checked={form.scopeBox.influencerShoutoutSpecific?.instagramPromotionTypes?.includes(type) || false}
                              onChange={(e) => handleInfluencerShoutoutMultiSelect('instagramPromotionTypes', type, e.target.checked)}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm font-medium">{type}</span>
                          </label>
                        ))}
                      </div>

                      {/* Instagram specific fields */}
                      {form.scopeBox.influencerShoutoutSpecific.instagramPromotionTypes?.includes('Reel') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="instagramReelCount"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramReelCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Reels"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="instagramReelDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramReelDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Each Reel Stays Live"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}

                      {form.scopeBox.influencerShoutoutSpecific.instagramPromotionTypes?.includes('Post') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="instagramPostCount"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramPostCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Posts"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="instagramPostDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramPostDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Each Post Stays Live"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}

                      {form.scopeBox.influencerShoutoutSpecific.instagramPromotionTypes?.includes('Story') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="instagramStoryCount"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramStoryCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Stories"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="instagramStoryDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.instagramStoryDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Each Story Stays Live"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}

                      {form.scopeBox.influencerShoutoutSpecific.instagramPromotionTypes?.includes('Link in Bio') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            name="linkInBioDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.linkInBioDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Link Stays in Bio"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="callToActionText"
                            value={form.scopeBox.influencerShoutoutSpecific.callToActionText || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Call-to-Action Text"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* YouTube Promotion Types */}
                  {(form.scopeBox.influencerShoutoutSpecific?.platforms?.includes('YouTube') || form.scopeBox.influencerShoutoutSpecific?.platforms?.includes('Both')) && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">YouTube Promotion Types</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {youtubePromotionTypesInfluencer.map(type => (
                          <label key={type} className="flex items-center space-x-2 text-navy-900 font-inter p-3 bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer shadow-sm">
                            <input
                              type="checkbox"
                              checked={form.scopeBox.influencerShoutoutSpecific?.youtubePromotionTypes?.includes(type) || false}
                              onChange={(e) => handleInfluencerShoutoutMultiSelect('youtubePromotionTypes', type, e.target.checked)}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm font-medium">{type}</span>
                          </label>
                        ))}
                      </div>

                      {/* YouTube specific fields */}
                      {form.scopeBox.influencerShoutoutSpecific.youtubePromotionTypes?.includes('Shorts') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="youtubeShortsCount"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubeShortsCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Shorts"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="youtubeShortsDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubeShortsDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Each Short Stays Live"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}

                      {form.scopeBox.influencerShoutoutSpecific.youtubePromotionTypes?.includes('Full Video Mention') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="youtubeVideoCount"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubeVideoCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Videos"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="youtubeMentionDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubeMentionDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Mention Duration (seconds)"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}

                      {form.scopeBox.influencerShoutoutSpecific.youtubePromotionTypes?.includes('Pinned Comment') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <input
                            type="number"
                            name="youtubePinnedCommentCount"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubePinnedCommentCount || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Number of Videos"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                          <input
                            type="text"
                            name="youtubePinnedDuration"
                            value={form.scopeBox.influencerShoutoutSpecific.youtubePinnedDuration || ''}
                            onChange={handleInfluencerShoutoutInput}
                            placeholder="Duration Pinned"
                            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campaign Details */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Campaign Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Campaign Duration</label>
                        <input
                          type="text"
                          name="campaignDuration"
                          value={form.scopeBox.influencerShoutoutSpecific?.campaignDuration || ''}
                          onChange={handleInfluencerShoutoutInput}
                          placeholder="e.g., 7 days, 2 weeks, 1 month"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        />
                      </div>
                      <textarea
                        name="targetAudience"
                        value={form.scopeBox.influencerShoutoutSpecific?.targetAudience || ''}
                        onChange={handleInfluencerShoutoutInput}
                        placeholder="Target Audience Demographics"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      />
                      <textarea
                        name="geographicTargeting"
                        value={form.scopeBox.influencerShoutoutSpecific?.geographicTargeting || ''}
                        onChange={handleInfluencerShoutoutInput}
                        placeholder="Geographic Targeting"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      />
                      <input
                        type="number"
                        name="expectedReach"
                        value={form.scopeBox.influencerShoutoutSpecific?.expectedReach || ''}
                        onChange={handleInfluencerShoutoutInput}
                        placeholder="Expected Reach/Impressions"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      />
                      <textarea
                        name="deliverablesTimeline"
                        value={form.scopeBox.influencerShoutoutSpecific?.deliverablesTimeline || ''}
                        onChange={handleInfluencerShoutoutInput}
                        placeholder="Deliverables Timeline"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Attachment Fields */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Brand Guidelines (PDF upload)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, influencerShoutoutSpecific: { ...prev.scopeBox.influencerShoutoutSpecific, brandGuidelinesPdf: e.target.files?.[0] || null } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Creative Assets (ZIP upload)</label>
                        <input
                          type="file"
                          accept=".zip"
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, influencerShoutoutSpecific: { ...prev.scopeBox.influencerShoutoutSpecific, creativeAssetsZip: e.target.files?.[0] || null } } }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gaming Account Sale Specific Module */}
              {isGamingAccountSaleSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎮</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Gaming Account Sale - Buyer Requirements</h3>
                  </div>

                  {/* Game Details */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Game Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <select
                        name="gameName"
                        value={form.scopeBox.gamingAccountSaleSpecific.gameName}
                        onChange={handleGamingAccountSaleInput}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      >
                        <option value="" className="text-neutral-400">Game Name</option>
                        {gameNames.map(game => <option key={game} value={game} className="text-navy-900">{game}</option>)}
                      </select>
                      <select
                        name="platform"
                        value={form.scopeBox.gamingAccountSaleSpecific.platform}
                        onChange={handleGamingAccountSaleInput}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      >
                        <option value="" className="text-neutral-400">Platform</option>
                        {gamingPlatforms.map(platform => <option key={platform} value={platform} className="text-navy-900">{platform}</option>)}
                      </select>
                      <input
                        type="text"
                        name="accountLevel"
                        value={form.scopeBox.gamingAccountSaleSpecific.accountLevel}
                        onChange={handleGamingAccountSaleInput}
                        placeholder="Account Level / Rank (expected)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <input
                        type="text"
                        name="accountRegion"
                        value={form.scopeBox.gamingAccountSaleSpecific.accountRegion}
                        onChange={handleGamingAccountSaleInput}
                        placeholder="Account Region/Server"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Buyer Requirements */}
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Buyer Requirements</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="email"
                        name="newEmailForTransfer"
                        value={form.scopeBox.gamingAccountSaleSpecific.newEmailForTransfer}
                        onChange={handleGamingAccountSaleInput}
                        placeholder="New Email for Transfer (buyer-provided)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <textarea
                        name="specialConditions"
                        value={form.scopeBox.gamingAccountSaleSpecific.specialConditions}
                        onChange={handleGamingAccountSaleInput}
                        placeholder="Special Conditions (e.g., unlinked from phone, recovery disabled, specific skins/items required)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[100px] resize-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Attachment Fields */}
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Screenshots of Expected Account Level/Rank (PNG, JPG)</label>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          multiple
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, gamingAccountSaleSpecific: { ...prev.scopeBox.gamingAccountSaleSpecific, screenshotFiles: Array.from(e.target.files || []) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Reference Documents (PDF)</label>
                        <input
                          type="file"
                          accept=".pdf"
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, gamingAccountSaleSpecific: { ...prev.scopeBox.gamingAccountSaleSpecific, referenceDocumentsPdf: e.target.files?.[0] || null } } }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E-Commerce Physical Item Escrow Specific Module */}
              {isEcommercePhysicalItemSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🛒</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Physical Item Escrow Details</h3>
                  </div>

                  {/* Phase 1 - Buyer ScopeBox (Order Proposal) */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">📦 Product Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <input
                        name="storeBrandName"
                        value={form.scopeBox.ecommercePhysicalItemSpecific.storeBrandName}
                        onChange={handleEcommercePhysicalItemInput}
                        placeholder="Store/Brand Name"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <input
                        name="productName"
                        value={form.scopeBox.ecommercePhysicalItemSpecific.productName}
                        onChange={handleEcommercePhysicalItemInput}
                        placeholder="Product Name"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <select
                        name="productType"
                        value={form.scopeBox.ecommercePhysicalItemSpecific.productType}
                        onChange={handleEcommercePhysicalItemInput}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      >
                        <option value="" className="text-neutral-400">Product Type</option>
                        {ecommerceProductTypes.map(type => (
                          <option key={type} value={type} className="text-navy-900">{type}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          name="quantity"
                          type="number"
                          min="1"
                          value={form.scopeBox.ecommercePhysicalItemSpecific.quantity}
                          onChange={handleEcommercePhysicalItemInput}
                          placeholder="Quantity"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <input
                          name="itemPrice"
                          type="number"
                          step="0.01"
                          value={form.scopeBox.ecommercePhysicalItemSpecific.itemPrice}
                          onChange={handleEcommercePhysicalItemInput}
                          placeholder="Price per Item"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                    </div>
                    <textarea
                      name="productDetails"
                      value={form.scopeBox.ecommercePhysicalItemSpecific.productDetails}
                      onChange={handleEcommercePhysicalItemInput}
                      placeholder="Product Details (size, color, model, customization, etc.)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[100px] resize-none mb-4 shadow-sm"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-indigo-600 font-inter mb-3">🚚 Delivery Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <textarea
                        name="deliveryAddress"
                        value={form.scopeBox.ecommercePhysicalItemSpecific.deliveryAddress}
                        onChange={handleEcommercePhysicalItemInput}
                        placeholder="Complete Delivery Address"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                        required
                      />
                      <input
                        name="deliveryDeadline"
                        type="datetime-local"
                        value={form.scopeBox.ecommercePhysicalItemSpecific.deliveryDeadline}
                        onChange={handleEcommercePhysicalItemInput}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-navy-900 font-inter mb-3">📎 Attachments</h4>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Reference Image of Product (PNG, JPG)</label>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, ecommercePhysicalItemSpecific: { ...prev.scopeBox.ecommercePhysicalItemSpecific, referenceImageFile: e.target.files?.[0] || null } } }))}
                      />
                    </div>
                  </div>

                  {/* Phase 2 - Seller Delivery Details (Hidden until order accepted) */}
                  {form.orderAccepted && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg">
                      <h4 className="text-md font-semibold text-orange-600 font-inter mb-3">🚛 Seller Delivery Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input
                          name="trackingId"
                          value={form.scopeBox.ecommercePhysicalItemSpecific.trackingId}
                          onChange={handleEcommercePhysicalItemInput}
                          placeholder="Tracking ID"
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                        <select
                          name="courierProvider"
                          value={form.scopeBox.ecommercePhysicalItemSpecific.courierProvider}
                          onChange={handleEcommercePhysicalItemInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        >
                          <option value="" className="text-neutral-400">Courier/Logistics Provider</option>
                          {courierProviders.map(provider => (
                            <option key={provider} value={provider} className="text-navy-900">{provider}</option>
                          ))}
                        </select>
                        <input
                          name="dispatchDate"
                          type="datetime-local"
                          value={form.scopeBox.ecommercePhysicalItemSpecific.dispatchDate}
                          onChange={handleEcommercePhysicalItemInput}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-navy-900 font-inter mb-1">Proof of Shipment (Invoice, courier receipt, package photo - PNG, JPG, PDF)</label>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf"
                          multiple
                          className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                          onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, ecommercePhysicalItemSpecific: { ...prev.scopeBox.ecommercePhysicalItemSpecific, proofOfShipmentFiles: Array.from(e.target.files || []) } } }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Phase 3 - Buyer Confirmation (Shown after delivery submitted) */}
                  {form.deliverySubmitted && (
                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-md font-semibold text-indigo-700 font-inter mb-3">✅ Buyer Confirmation</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <label className="flex items-center space-x-3 text-navy-900 font-inter">
                          <input
                            name="deliveryReceived"
                            type="checkbox"
                            checked={form.scopeBox.ecommercePhysicalItemSpecific.deliveryReceived}
                            onChange={handleEcommercePhysicalItemInput}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Delivery Received?</span>
                        </label>
                        <label className="flex items-center space-x-3 text-navy-900 font-inter">
                          <input
                            name="itemMatchesDescription"
                            type="checkbox"
                            checked={form.scopeBox.ecommercePhysicalItemSpecific.itemMatchesDescription}
                            onChange={handleEcommercePhysicalItemInput}
                            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Item Matches ScopeBox Description?</span>
                        </label>
                      </div>
                      {(!form.scopeBox.ecommercePhysicalItemSpecific.itemMatchesDescription || !form.scopeBox.ecommercePhysicalItemSpecific.deliveryReceived) && (
                        <div>
                          <label className="block text-sm text-navy-900 font-inter mb-1">Upload Photos for Verification (Required for mismatch/damage reports - PNG, JPG)</label>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            multiple
                            className="w-full text-navy-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white"
                            onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, ecommercePhysicalItemSpecific: { ...prev.scopeBox.ecommercePhysicalItemSpecific, verificationPhotos: Array.from(e.target.files || []) } } }))}
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* App Development Specific Module */}
              {isAppDevelopmentSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">📱</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">App Development Specific</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select name="appType" value={form.scopeBox.appDevelopmentSpecific.appType} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">App Type</option>
                      {appTypes.map(t => <option key={t} value={t} className="text-navy-900">{t}</option>)}
                    </select>
                    {form.scopeBox.appDevelopmentSpecific.appType === 'Other' && (
                      <input name="appTypeOther" value={form.scopeBox.appDevelopmentSpecific.appTypeOther} onChange={handleAppInput} placeholder="Define App Type" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Development Framework (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {developmentFrameworks.map(fr => (
                          <label key={fr} className="flex items-center space-x-2 text-navy-900 font-inter">
                            <input type="checkbox" checked={form.scopeBox.appDevelopmentSpecific.developmentFrameworks.includes(fr)} onChange={(e) => handleAppMultiSelect('developmentFrameworks', fr, e.target.checked)} className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm">{fr}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Target OS & Versions (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Android 9', 'Android 10', 'Android 11', 'Android 12', 'Android 13', 'iOS 14', 'iOS 15', 'iOS 16', 'iOS 17'].map(v => (
                          <label key={v} className="flex items-center space-x-2 text-navy-900 font-inter">
                            <input type="checkbox" checked={form.scopeBox.appDevelopmentSpecific.targetOsVersions.includes(v)} onChange={(e) => handleAppMultiSelect('targetOsVersions', v, e.target.checked)} className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm">{v}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <input type="number" name="numberOfScreens" value={form.scopeBox.appDevelopmentSpecific.numberOfScreens} onChange={handleAppInput} placeholder="Number of Screens" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
                    <select name="offlineFunctionality" value={form.scopeBox.appDevelopmentSpecific.offlineFunctionality} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">Offline Functionality Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select name="userAuthentication" value={form.scopeBox.appDevelopmentSpecific.userAuthentication} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">User Authentication Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select name="backendResponsibility" value={form.scopeBox.appDevelopmentSpecific.backendResponsibility} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">Hosting/Backend Deployment Responsibility</option>
                      {hostingResponsibility.map(hr => <option key={hr} value={hr} className="text-navy-900">{hr}</option>)}
                    </select>
                    <div className="sm:col-span-2">
                      <textarea name="keyFeatures" value={form.scopeBox.appDevelopmentSpecific.keyFeatures} onChange={handleAppInput} placeholder="Key Features (list exact functional requirements)" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm" required />
                    </div>
                    <div className="sm:col-span-2">
                      <textarea name="thirdPartyIntegrations" value={form.scopeBox.appDevelopmentSpecific.thirdPartyIntegrations} onChange={handleAppInput} placeholder="Third-party Integrations" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm" required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Security Requirements (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {appSecurityRequirements.map(sec => (
                          <label key={sec} className="flex items-center space-x-2 text-navy-900 font-inter">
                            <input type="checkbox" checked={form.scopeBox.appDevelopmentSpecific.securityRequirements.includes(sec)} onChange={(e) => handleAppMultiSelect('securityRequirements', sec, e.target.checked)} className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm">{sec}</span>
                          </label>
                        ))}
                      </div>
                      {form.scopeBox.appDevelopmentSpecific.securityRequirements.includes('Other') && (
                        <input name="securityRequirementsOther" value={form.scopeBox.appDevelopmentSpecific.securityRequirementsOther} onChange={handleAppInput} placeholder="Define Other Security Requirements" className="mt-2 w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
                      )}
                    </div>
                    <input name="performanceTargets" value={form.scopeBox.appDevelopmentSpecific.performanceTargets} onChange={handleAppInput} placeholder="Performance Targets (e.g., launch time < 3s)" className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required />
                    <select name="sourceCodeDelivery" value={form.scopeBox.appDevelopmentSpecific.sourceCodeDelivery} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">Source Code Delivery Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select name="appStoreSubmission" value={form.scopeBox.appDevelopmentSpecific.appStoreSubmission} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">App Store Submission Responsibility</option>
                      {appStoreSubmissionResp.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <select name="documentation" value={form.scopeBox.appDevelopmentSpecific.documentation} onChange={handleAppInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                      <option value="" className="text-neutral-400">Documentation Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* App Development Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">UI/UX Mockups (Image/PDF upload)</label>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, appDevelopmentSpecific: { ...prev.scopeBox.appDevelopmentSpecific, uiuxMockups: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Guidelines (PDF upload)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, appDevelopmentSpecific: { ...prev.scopeBox.appDevelopmentSpecific, guidelines: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}
              {/* Video Editing Specific Module */}
              {isVideoEditingSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎬</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Video Editing Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      name="duration"
                      value={form.scopeBox.videoEditingSpecific.duration}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, duration: e.target.value } } }))}
                      placeholder="Required Duration (mm:ss)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="software"
                      value={form.scopeBox.videoEditingSpecific.software}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, software: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Editing Software</option>
                      {videoSoftwares.map(s => <option key={s} value={s} className="text-navy-900">{s}</option>)}
                    </select>
                    <select
                      name="resolution"
                      value={form.scopeBox.videoEditingSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, resolution: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {videoResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <select
                      name="frameRate"
                      value={form.scopeBox.videoEditingSpecific.frameRate}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, frameRate: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Frame Rate</option>
                      {videoFrameRates.map(fr => <option key={fr} value={fr} className="text-navy-900">{fr}</option>)}
                    </select>
                    <select
                      name="format"
                      value={form.scopeBox.videoEditingSpecific.format}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, format: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Video Format</option>
                      {videoFileFormats.map(v => <option key={v} value={v} className="text-navy-900">{v}</option>)}
                    </select>
                    <select
                      name="audioTrack"
                      value={form.scopeBox.videoEditingSpecific.audioTrack}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, audioTrack: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Audio Track Required?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <input
                      type="number"
                      name="videoCount"
                      value={form.scopeBox.videoEditingSpecific.videoCount}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, videoCount: e.target.value } } }))}
                      placeholder="Number of Videos to Deliver"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <textarea
                      name="storyboard"
                      value={form.scopeBox.videoEditingSpecific.storyboard}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, videoEditingSpecific: { ...prev.scopeBox.videoEditingSpecific, storyboard: e.target.value } } }))}
                      placeholder="Storyboard / Sequence Description"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      required
                    />
                  </div>
                </div>
              )}

              {/* NFT Art Creation Details Module */}
              {isNftArtSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🧬</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">NFT Art Creation Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="nftType"
                      value={form.scopeBox.nftArtSpecific.nftType}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, nftType: e.target.value, nftTypeOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">NFT Type</option>
                      {nftTypes.map(t => <option key={t} value={t} className="text-navy-900">{t}</option>)}
                    </select>
                    {form.scopeBox.nftArtSpecific.nftType === 'Other' && (
                      <input
                        name="nftTypeOther"
                        value={form.scopeBox.nftArtSpecific.nftTypeOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, nftTypeOther: e.target.value } } }))}
                        placeholder="Define NFT Type"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="artworkStyle"
                      value={form.scopeBox.nftArtSpecific.artworkStyle}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, artworkStyle: e.target.value, artworkStyleOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Artwork Style</option>
                      {nftStyles.map(s => <option key={s} value={s} className="text-navy-900">{s}</option>)}
                    </select>
                    {form.scopeBox.nftArtSpecific.artworkStyle === 'Other' && (
                      <input
                        name="artworkStyleOther"
                        value={form.scopeBox.nftArtSpecific.artworkStyleOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, artworkStyleOther: e.target.value } } }))}
                        placeholder="Define Artwork Style"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="resolution"
                      value={form.scopeBox.nftArtSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, resolution: e.target.value, resolutionCustom: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {nftResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    {form.scopeBox.nftArtSpecific.resolution === 'Custom' && (
                      <input
                        name="resolutionCustom"
                        value={form.scopeBox.nftArtSpecific.resolutionCustom}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, resolutionCustom: e.target.value } } }))}
                        placeholder="Custom Resolution (e.g., 3500x3500)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="fileFormat"
                      value={form.scopeBox.nftArtSpecific.fileFormat}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, fileFormat: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">File Format</option>
                      {nftFileFormats.map(f => <option key={f} value={f} className="text-navy-900">{f}</option>)}
                    </select>
                    <select
                      name="blockchain"
                      value={form.scopeBox.nftArtSpecific.blockchain}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, blockchain: e.target.value, blockchainOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Blockchain Preference</option>
                      {nftBlockchains.map(b => <option key={b} value={b} className="text-navy-900">{b}</option>)}
                    </select>
                    {form.scopeBox.nftArtSpecific.blockchain === 'Other' && (
                      <input
                        name="blockchainOther"
                        value={form.scopeBox.nftArtSpecific.blockchainOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, blockchainOther: e.target.value } } }))}
                        placeholder="Define Blockchain"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="metadataRequired"
                      value={form.scopeBox.nftArtSpecific.metadataRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, metadataRequired: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Metadata Required?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <input
                      type="number"
                      name="numberOfArtworks"
                      value={form.scopeBox.nftArtSpecific.numberOfArtworks}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, numberOfArtworks: e.target.value } } }))}
                      placeholder="Number of Artworks to Deliver"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="ownershipTransfer"
                      value={form.scopeBox.nftArtSpecific.ownershipTransfer}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, ownershipTransfer: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Ownership Rights Transfer?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* NFT Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Reference Artwork / Moodboard (PNG, JPG, GIF) — multiple</label>
                      <input type="file" multiple accept=".png,.jpg,.jpeg,.gif" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, refMoodboardFiles: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Style Guide / Brand Guidelines (PDF)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, styleGuidePdf: e.target.files?.[0] || null } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Metadata Template (CSV or TXT)</label>
                      <input type="file" accept=".csv,.txt" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, nftArtSpecific: { ...prev.scopeBox.nftArtSpecific, metadataTemplate: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Illustration / Comics Details Module */}
              {isIllustrationSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎨</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Illustration / Comics Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="illustrationType"
                      value={form.scopeBox.illustrationSpecific.illustrationType}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, illustrationType: e.target.value, illustrationTypeOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Illustration Type</option>
                      {illustrationTypes.map(t => <option key={t} value={t} className="text-navy-900">{t}</option>)}
                    </select>
                    {form.scopeBox.illustrationSpecific.illustrationType === 'Other' && (
                      <input
                        name="illustrationTypeOther"
                        value={form.scopeBox.illustrationSpecific.illustrationTypeOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, illustrationTypeOther: e.target.value } } }))}
                        placeholder="Define Illustration Type"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="artworkStyle"
                      value={form.scopeBox.illustrationSpecific.artworkStyle}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, artworkStyle: e.target.value, artworkStyleOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Artwork Style</option>
                      {illustrationStyles.map(s => <option key={s} value={s} className="text-navy-900">{s}</option>)}
                    </select>
                    {form.scopeBox.illustrationSpecific.artworkStyle === 'Other' && (
                      <input
                        name="artworkStyleOther"
                        value={form.scopeBox.illustrationSpecific.artworkStyleOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, artworkStyleOther: e.target.value } } }))}
                        placeholder="Define Artwork Style"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <input
                      type="number"
                      name="numberOfPages"
                      value={form.scopeBox.illustrationSpecific.numberOfPages}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, numberOfPages: e.target.value } } }))}
                      placeholder="Number of Pages / Panels"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="resolution"
                      value={form.scopeBox.illustrationSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, resolution: e.target.value, resolutionCustom: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {illustrationResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    {form.scopeBox.illustrationSpecific.resolution === 'Custom' && (
                      <input
                        name="resolutionCustom"
                        value={form.scopeBox.illustrationSpecific.resolutionCustom}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, resolutionCustom: e.target.value } } }))}
                        placeholder="Custom Resolution (e.g., 3500x3500)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="fileFormat"
                      value={form.scopeBox.illustrationSpecific.fileFormat}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, fileFormat: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">File Format</option>
                      {illustrationFileFormats.map(f => <option key={f} value={f} className="text-navy-900">{f}</option>)}
                    </select>
                    <select
                      name="colorOption"
                      value={form.scopeBox.illustrationSpecific.colorOption}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, colorOption: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Color or Black & White</option>
                      {illustrationColorOptions.map(c => <option key={c} value={c} className="text-navy-900">{c}</option>)}
                    </select>
                    <select
                      name="textRequired"
                      value={form.scopeBox.illustrationSpecific.textRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, textRequired: e.target.value, scriptDialogue: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Text / Dialogue Required?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    {form.scopeBox.illustrationSpecific.textRequired === 'Yes' && (
                      <textarea
                        name="scriptDialogue"
                        value={form.scopeBox.illustrationSpecific.scriptDialogue}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, scriptDialogue: e.target.value } } }))}
                        placeholder="Script or Dialogue Content"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="ownershipTransfer"
                      value={form.scopeBox.illustrationSpecific.ownershipTransfer}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, ownershipTransfer: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Ownership Rights Transfer?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* Illustration Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Reference Artwork / Style Samples (PNG, JPG, PDF) — multiple</label>
                      <input type="file" multiple accept=".png,.jpg,.jpeg,.pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, refArtworkFiles: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Script / Storyboard (TXT, DOCX, PDF)</label>
                      <input type="file" accept=".txt,.docx,.pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, scriptStoryboard: e.target.files?.[0] || null } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Guidelines or Style Guide (PDF)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, illustrationSpecific: { ...prev.scopeBox.illustrationSpecific, guidelinesPdf: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* 3D Modeling / Rendering Details Module */}
              {is3dModelingSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎯</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">3D Modeling / Rendering Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="modelType"
                      value={form.scopeBox.model3dSpecific.modelType}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, modelType: e.target.value, modelTypeOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Model Type</option>
                      {modelTypes.map(t => <option key={t} value={t} className="text-navy-900">{t}</option>)}
                    </select>
                    {form.scopeBox.model3dSpecific.modelType === 'Other' && (
                      <input
                        name="modelTypeOther"
                        value={form.scopeBox.model3dSpecific.modelTypeOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, modelTypeOther: e.target.value } } }))}
                        placeholder="Define Model Type"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="detailLevel"
                      value={form.scopeBox.model3dSpecific.detailLevel}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, detailLevel: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Level of Detail</option>
                      {detailLevels.map(d => <option key={d} value={d} className="text-navy-900">{d}</option>)}
                    </select>
                    <select
                      name="renderingQuality"
                      value={form.scopeBox.model3dSpecific.renderingQuality}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, renderingQuality: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Rendering Quality</option>
                      {renderingQualities.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <select
                      name="fileFormat"
                      value={form.scopeBox.model3dSpecific.fileFormat}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, fileFormat: e.target.value, fileFormatOther: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">File Format</option>
                      {modelFileFormats.map(f => <option key={f} value={f} className="text-navy-900">{f}</option>)}
                    </select>
                    {form.scopeBox.model3dSpecific.fileFormat === 'Other' && (
                      <input
                        name="fileFormatOther"
                        value={form.scopeBox.model3dSpecific.fileFormatOther}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, fileFormatOther: e.target.value } } }))}
                        placeholder="Define File Format"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="textureRequired"
                      value={form.scopeBox.model3dSpecific.textureRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, textureRequired: e.target.value, textureFormat: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Texture Requirements</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    {form.scopeBox.model3dSpecific.textureRequired === 'Yes' && (
                      <select
                        name="textureFormat"
                        value={form.scopeBox.model3dSpecific.textureFormat}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, textureFormat: e.target.value } } }))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      >
                        <option value="" className="text-neutral-400">Texture Format</option>
                        {textureFormats.map(t => <option key={t} value={t} className="text-navy-900">{t}</option>)}
                      </select>
                    )}
                    <select
                      name="animationRequired"
                      value={form.scopeBox.model3dSpecific.animationRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, animationRequired: e.target.value, animationDuration: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Animation Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    {form.scopeBox.model3dSpecific.animationRequired === 'Yes' && (
                      <input
                        type="number"
                        name="animationDuration"
                        value={form.scopeBox.model3dSpecific.animationDuration}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, animationDuration: e.target.value } } }))}
                        placeholder="Duration in seconds"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <input
                      type="number"
                      name="numberOfViews"
                      value={form.scopeBox.model3dSpecific.numberOfViews}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, numberOfViews: e.target.value } } }))}
                      placeholder="Number of Views / Renders Needed"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="renderResolution"
                      value={form.scopeBox.model3dSpecific.renderResolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, renderResolution: e.target.value, renderResolutionCustom: '' } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution for Renders</option>
                      {renderResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    {form.scopeBox.model3dSpecific.renderResolution === 'Custom' && (
                      <input
                        name="renderResolutionCustom"
                        value={form.scopeBox.model3dSpecific.renderResolutionCustom}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, renderResolutionCustom: e.target.value } } }))}
                        placeholder="Custom Resolution (e.g., 2560x1440)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <select
                      name="ownershipTransfer"
                      value={form.scopeBox.model3dSpecific.ownershipTransfer}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, ownershipTransfer: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Ownership Rights Transfer?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* 3D Modeling Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Reference Models / Inspiration Images (JPG, PNG, OBJ, FBX) — multiple</label>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.obj,.fbx" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, refModelFiles: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Technical Drawings / Blueprints (PDF, DWG)</label>
                      <input type="file" accept=".pdf,.dwg" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, technicalDrawings: e.target.files?.[0] || null } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Guidelines or Style Guide (PDF)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, model3dSpecific: { ...prev.scopeBox.model3dSpecific, guidelinesPdf: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Motion Graphics — Dispute-Focused Module */}
              {isMotionGraphicsSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🎞️</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Motion Graphics — Dispute-Focused</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="animationStyle"
                      value={form.scopeBox.motionGraphicsSpecific.animationStyle}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, animationStyle: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Animation Style</option>
                      {motionStyles.map(ms => <option key={ms} value={ms} className="text-navy-900">{ms}</option>)}
                    </select>
                    <input
                      name="duration"
                      value={form.scopeBox.motionGraphicsSpecific.duration}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, duration: e.target.value } } }))}
                      placeholder="Required Duration (mm:ss)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="resolution"
                      value={form.scopeBox.motionGraphicsSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, resolution: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {motionResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <select
                      name="frameRate"
                      value={form.scopeBox.motionGraphicsSpecific.frameRate}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, frameRate: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Frame Rate</option>
                      {motionFrameRates.map(fr => <option key={fr} value={fr} className="text-navy-900">{fr}</option>)}
                    </select>
                    <select
                      name="format"
                      value={form.scopeBox.motionGraphicsSpecific.format}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, format: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">File Format</option>
                      {motionFileFormats.map(f => <option key={f} value={f} className="text-navy-900">{f}</option>)}
                    </select>
                    <select
                      name="audioRequired"
                      value={form.scopeBox.motionGraphicsSpecific.audioRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, audioRequired: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Audio/SFX Required?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select
                      name="textRequired"
                      value={form.scopeBox.motionGraphicsSpecific.textRequired}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, textRequired: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Text/Caption Integration?</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* Dispute-Focused Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Storyboard / Script (PDF or write below)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, storyboardPdf: e.target.files?.[0] || null } } }))} />
                      <textarea
                        name="storyboardText"
                        value={form.scopeBox.motionGraphicsSpecific.storyboardText}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, storyboardText: e.target.value } } }))}
                        placeholder="Or describe storyboard/sequence here"
                        className="mt-2 w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Reference Animations (MP4, MOV, GIF)</label>
                      <input type="file" multiple accept=".mp4,.mov,.gif" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, referenceFiles: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Brand Guidelines Document (PDF) — Optional</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, motionGraphicsSpecific: { ...prev.scopeBox.motionGraphicsSpecific, brandGuidelinesPdf: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Website Development Specific Module */}
              {isWebsiteDevelopmentSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🌐</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Website Development Specific</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      name="websiteType"
                      value={form.scopeBox.websiteDevelopmentSpecific.websiteType}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Website Type</option>
                      {websiteTypes.map(wt => <option key={wt} value={wt} className="text-navy-900">{wt}</option>)}
                    </select>
                    {form.scopeBox.websiteDevelopmentSpecific.websiteType === 'Other' && (
                      <input
                        name="websiteTypeOther"
                        value={form.scopeBox.websiteDevelopmentSpecific.websiteTypeOther}
                        onChange={handleWebsiteInput}
                        placeholder="Define Website Type"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    )}
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Technology Stack (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {technologyStacks.map(tech => (
                          <label key={tech} className="flex items-center space-x-2 text-navy-900 font-inter cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.scopeBox.websiteDevelopmentSpecific.technologyStack.includes(tech)}
                              onChange={(e) => handleWebsiteMultiSelect('technologyStack', tech, e.target.checked)}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm">{tech}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      name="numberOfPages"
                      value={form.scopeBox.websiteDevelopmentSpecific.numberOfPages}
                      onChange={handleWebsiteInput}
                      placeholder="Number of Pages"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="responsiveDesign"
                      value={form.scopeBox.websiteDevelopmentSpecific.responsiveDesign}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Responsive Design Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Browser Compatibility Requirement (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {browserCompatibility.map(browser => (
                          <label key={browser} className="flex items-center space-x-2 text-navy-900 font-inter cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.scopeBox.websiteDevelopmentSpecific.browserCompatibility.includes(browser)}
                              onChange={(e) => handleWebsiteMultiSelect('browserCompatibility', browser, e.target.checked)}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm">{browser}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <select
                      name="hostingResponsibility"
                      value={form.scopeBox.websiteDevelopmentSpecific.hostingResponsibility}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Hosting & Deployment Responsibility</option>
                      {hostingResponsibility.map(hr => <option key={hr} value={hr} className="text-navy-900">{hr}</option>)}
                    </select>
                    <div className="sm:col-span-2">
                      <textarea
                        name="keyFeatures"
                        value={form.scopeBox.websiteDevelopmentSpecific.keyFeatures}
                        onChange={handleWebsiteInput}
                        placeholder="Key Features (list exact functional requirements)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                        required
                      />
                    </div>
                    <select
                      name="adminPanel"
                      value={form.scopeBox.websiteDevelopmentSpecific.adminPanel}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Admin Panel Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <div className="sm:col-span-2">
                      <textarea
                        name="thirdPartyIntegrations"
                        value={form.scopeBox.websiteDevelopmentSpecific.thirdPartyIntegrations}
                        onChange={handleWebsiteInput}
                        placeholder="Third-party Integrations"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-navy-900 font-inter mb-2">Security Requirements (Multi-select)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {securityRequirements.map(security => (
                          <label key={security} className="flex items-center space-x-2 text-navy-900 font-inter cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.scopeBox.websiteDevelopmentSpecific.securityRequirements.includes(security)}
                              onChange={(e) => handleWebsiteMultiSelect('securityRequirements', security, e.target.checked)}
                              className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm">{security}</span>
                          </label>
                        ))}
                      </div>
                      {form.scopeBox.websiteDevelopmentSpecific.securityRequirements.includes('Other') && (
                        <input
                          name="securityRequirementsOther"
                          value={form.scopeBox.websiteDevelopmentSpecific.securityRequirementsOther}
                          onChange={handleWebsiteInput}
                          placeholder="Define Other Security Requirements"
                          className="mt-2 w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                          required
                        />
                      )}
                    </div>
                    <select
                      name="codeOwnership"
                      value={form.scopeBox.websiteDevelopmentSpecific.codeOwnership}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Code Ownership Transfer Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select
                      name="sourceCodeDelivery"
                      value={form.scopeBox.websiteDevelopmentSpecific.sourceCodeDelivery}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Source Code Delivery Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                    <select
                      name="documentation"
                      value={form.scopeBox.websiteDevelopmentSpecific.documentation}
                      onChange={handleWebsiteInput}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Documentation Requirement</option>
                      <option value="Yes" className="text-navy-900">Yes</option>
                      <option value="No" className="text-navy-900">No</option>
                    </select>
                  </div>

                  {/* Website Development Attachments */}
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Wireframes / Mockups (Image/PDF upload)</label>
                      <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, websiteDevelopmentSpecific: { ...prev.scopeBox.websiteDevelopmentSpecific, wireframes: Array.from(e.target.files || []) } } }))} />
                    </div>
                    <div>
                      <label className="block text-sm text-navy-900 font-inter mb-1">Guidelines (PDF upload)</label>
                      <input type="file" accept=".pdf" className="w-full text-navy-900 cursor-pointer border border-neutral-200 rounded-xl p-2 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200" onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, websiteDevelopmentSpecific: { ...prev.scopeBox.websiteDevelopmentSpecific, guidelines: e.target.files?.[0] || null } } }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Poster/Flyer/Banner Specific Module */}
              {isPosterDesignSelected() && (
                <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-2">🖼️</span>
                    <h3 className="text-lg font-semibold text-navy-900 font-inter">Poster/Flyer/Banner Specific Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="width"
                        value={form.scopeBox.posterSpecific.width}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, width: e.target.value } } }))}
                        placeholder="Width (px/in)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <input
                        type="number"
                        name="height"
                        value={form.scopeBox.posterSpecific.height}
                        onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, height: e.target.value } } }))}
                        placeholder="Height (px/in)"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    </div>
                    <select
                      name="resolution"
                      value={form.scopeBox.posterSpecific.resolution}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, resolution: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Resolution</option>
                      {posterResolutions.map(r => <option key={r} value={r} className="text-navy-900">{r}</option>)}
                    </select>
                    <select
                      name="orientation"
                      value={form.scopeBox.posterSpecific.orientation}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, orientation: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Orientation</option>
                      {posterOrientations.map(o => <option key={o} value={o} className="text-navy-900">{o}</option>)}
                    </select>
                    <textarea
                      name="textContent"
                      value={form.scopeBox.posterSpecific.textContent}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, textContent: e.target.value } } }))}
                      placeholder="Text Content (exact wording)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter min-h-[80px] resize-none shadow-sm"
                      required
                    />
                    <input
                      name="brandColors"
                      value={form.scopeBox.posterSpecific.brandColors}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, brandColors: e.target.value } } }))}
                      placeholder="Brand Colors (HEX or names)"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <input
                      name="fonts"
                      value={form.scopeBox.posterSpecific.fonts}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, fonts: e.target.value } } }))}
                      placeholder="Fonts to Use"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                    <select
                      name="designStyle"
                      value={form.scopeBox.posterSpecific.designStyle}
                      onChange={(e) => setForm(prev => ({ ...prev, scopeBox: { ...prev.scopeBox, posterSpecific: { ...prev.scopeBox.posterSpecific, designStyle: e.target.value } } }))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    >
                      <option value="" className="text-neutral-400">Design Style</option>
                      {posterDesignStyles.map(s => <option key={s} value={s} className="text-navy-900">{s}</option>)}
                    </select>
                  </div>
                </div>
              )}



              <div
                className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer bg-white transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50 flex flex-col items-center justify-center space-y-4 shadow-sm"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  multiple
                  accept={
                    isLogoDesignSelected() ? ".jpg,.jpeg,.png,.svg,.pdf,.ai,.eps" :
                      isPosterDesignSelected() ? ".jpg,.jpeg,.png,.svg,.pdf,.psd,.ai" :
                        isSocialPostSelected() ? ".jpg,.jpeg,.png,.gif,.mp4" :
                          isVideoEditingSelected() ? ".mp4,.mov,.avi,.mkv" :
                            isMotionGraphicsSelected() ? "*" :
                              isNftArtSelected() ? "*" :
                                isIllustrationSelected() ? "*" :
                                  is3dModelingSelected() ? ".obj,.fbx,.stl,.blend,.glb,.jpg,.jpeg,.png,.tiff,.pdf,.dwg" :
                                    isWebsiteDevelopmentSelected() ? ".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt,.zip,.rar,.psd,.ai,.sketch,.fig" :
                                      isAppDevelopmentSelected() ? ".zip,.rar,.pdf,.png,.jpg,.mp4" :
                                        isInstagramGrowthSelected() ? ".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt" :
                                          isInstagramPromotionSelected() ? ".jpg,.jpeg,.png,.gif,.mp4,.pdf,.doc,.docx,.txt" :
                                            isYouTubePromotionSelected() ? ".pdf,.png,.jpg,.jpeg,.mp4,.zip" :
                                              ".jpg,.jpeg,.png,.pdf,.mp4,.doc,.docx,.txt,.zip,.rar"
                  }
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <div className="space-y-3 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold text-navy-900 font-inter">Upload Multiple Files</div>
                  <div className="text-sm text-neutral-500 font-inter">
                    Click to browse or drag & drop multiple files here
                  </div>
                  <div className="text-xs text-neutral-400 font-inter max-w-md mx-auto text-center mt-2">
                    {isLogoDesignSelected()
                      ? "Supported: Images (JPG, PNG, SVG), Vector files (AI, EPS), PDFs"
                      : isPosterDesignSelected()
                        ? "Supported: JPG, PNG, SVG, PDF, PSD, AI"
                        : isSocialPostSelected()
                          ? "Supported: JPG, PNG, GIF, MP4"
                          : isVideoEditingSelected()
                            ? "Supported: MP4, MOV, AVI, MKV"
                            : isMotionGraphicsSelected()
                              ? "Supported: All common file types"
                              : isNftArtSelected()
                                ? "Supported: All common file types"
                                : isIllustrationSelected()
                                  ? "Supported: All common file types"
                                  : is3dModelingSelected()
                                    ? "Supported: 3D models (OBJ, FBX, STL, BLEND, GLB), Images (JPG, PNG, TIFF), PDF, DWG"
                                    : isWebsiteDevelopmentSelected()
                                      ? "Supported: Images (JPG, PNG), PDFs, Documents (DOC, DOCX, TXT), Design files (PSD, AI, SKETCH, FIG), Archives (ZIP, RAR)"
                                      : isAppDevelopmentSelected()
                                        ? "Supported: ZIP, RAR, PDF, PNG, JPG, MP4 (APK/IPA uploads are blocked until final delivery)"
                                        : isInstagramGrowthSelected()
                                          ? "Supported: Images (JPG, PNG), PDFs, Documents (DOC, DOCX, TXT)"
                                          : isInstagramPromotionSelected()
                                            ? "Supported: Images (JPG, PNG, GIF), Videos (MP4), PDFs, Documents (DOC, DOCX, TXT)"
                                            : isYouTubePromotionSelected()
                                              ? "Supported: PDF, PNG, JPG, MP4, ZIP"
                                              : isInfluencerShoutoutSelected()
                                                ? "Supported: PDF, PNG, JPG, MP4, ZIP"
                                                : "Supported: Images, PDFs, Videos, Documents, Archives"}
                  </div>
                  <label htmlFor="file-upload" className="inline-block mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 cursor-pointer font-inter font-medium shadow-sm hover:shadow-md">
                    Choose Files
                  </label>
                </div>

                {filePreviews.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-neutral-200 w-full text-left">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm font-semibold text-navy-900 font-inter">
                        Selected Files ({filePreviews.length})
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilePreviews([]);
                          setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: [] } });
                        }}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors font-inter"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {filePreviews.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg p-3 shadow-sm hover:border-indigo-300 transition-colors">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-md text-indigo-600">
                              {/* Using emojis as fallback icons for simplicity, could be replaced with SVG icons */}
                              {f.type.startsWith('image/') ? '🖼️' :
                                f.type.includes('pdf') ? '📄' :
                                  f.type.includes('video') ? '🎥' :
                                    f.type.includes('document') ? '📝' : '📎'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs truncate font-medium text-navy-900 font-inter">{f.name}</div>
                              <div className="text-xs text-neutral-500 font-inter">{formatFileSize(f.size)}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFiles = filePreviews.filter((_, index) => index !== i);
                              setFilePreviews(newFiles);
                              setForm({ ...form, scopeBox: { ...form.scopeBox, attachments: newFiles } });
                            }}
                            className="text-neutral-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors text-xs flex-shrink-0"
                            title="Remove file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-neutral-500 font-inter text-center">
                      Need more? Click "Choose Files" again to add to your selection
                    </div>
                  </div>
                )}
              </div>
              {!(isLogoDesignSelected() || isPosterDesignSelected() || isSocialPostSelected() || isVideoEditingSelected() || isMotionGraphicsSelected() || isNftArtSelected() || isIllustrationSelected() || is3dModelingSelected() || isWebsiteDevelopmentSelected() || isYouTubePromotionSelected() || isInfluencerShoutoutSelected() || isGamingAccountSaleSelected() || isEcommercePhysicalItemSelected()) && (
                <select name="condition" value={form.scopeBox.condition} onChange={handleScopeInput} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm" required>
                  <option value="" className="text-neutral-400">Condition of Product</option>
                  {conditions.map(c => <option key={c} value={c} className="text-navy-900">{c}</option>)}
                </select>
              )}

              {/* Deadline Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy-900 font-inter flex items-center">
                  <span className="mr-2">📅</span>
                  Project Deadline
                </label>
                <input
                  name="deadline"
                  type="datetime-local"
                  value={form.scopeBox.deadline}
                  onChange={handleScopeInput}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 font-inter shadow-sm"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-neutral-500 font-inter">Select the deadline for project completion</p>
              </div>

              {/* Price Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy-900 font-inter flex items-center">
                  <span className="mr-2">💰</span>
                  Project Price
                </label>
                <div className="relative">
                  <input
                    name="price"
                    type="number"
                    value={form.scopeBox.price}
                    onChange={handleScopeInput}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-neutral-500 text-sm font-medium font-inter">{form.currency || 'USD'}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 font-inter">Enter the total project cost</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  className="px-6 py-3 border border-neutral-300 text-navy-900 bg-white rounded-xl font-medium transition-all duration-300 hover:bg-neutral-50 font-inter w-full sm:w-auto shadow-sm"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-inter w-full sm:w-auto sm:min-w-[120px]"
                  disabled={!validateStep2()}
                  onClick={() => setStep(3)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Seller Contact */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-navy-900 font-inter">
                  Seller Contact Info
                </label>
                <input
                  name="sellerContact"
                  value={form.sellerContact}
                  onChange={handleInput}
                  placeholder="Seller Email or Phone"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  className="px-6 py-3 border border-neutral-300 text-navy-900 bg-white rounded-xl font-medium transition-all duration-300 hover:bg-neutral-50 font-inter w-full sm:w-auto shadow-sm"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-inter w-full sm:w-auto sm:min-w-[120px]"
                  disabled={!validateStep3()}
                  onClick={() => setStep(4)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl mb-4 text-green-500">✓</div>
              <h3 className="text-2xl font-bold text-navy-900 font-inter">Review & Confirm</h3>
              <p className="text-neutral-500 font-inter mb-6">Please carefully review the order details below.</p>

              <div className="bg-white border border-neutral-200 rounded-xl p-6 text-left text-sm sm:text-base shadow-sm">

                <h4 className="text-lg font-semibold text-navy-900 mb-4 border-b border-neutral-100 pb-2">General Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <span className="text-neutral-500 font-inter text-sm">Buyer</span>
                    <div className="text-navy-900 font-medium font-inter">{buyerData.firstName} {buyerData.lastName}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-inter text-sm">Platform</span>
                    <div className="text-navy-900 font-medium font-inter">{form.platform}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-neutral-500 font-inter text-sm">Seller's Platform Link</span>
                    <div className="text-navy-900 font-medium font-inter break-all">{form.productLink}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-inter text-sm">Service Category</span>
                    <div className="text-navy-900 font-medium font-inter">{form.serviceType}</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-inter text-sm">Location</span>
                    <div className="text-navy-900 font-medium font-inter">{form.country} ({form.currency})</div>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-inter text-sm">Seller Contact</span>
                    <div className="text-navy-900 font-medium font-inter">{form.sellerContact}</div>
                  </div>
                </div>

                {/* Project Summary */}
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-indigo-900 font-inter">Project Valuation</span>
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">📋</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center text-navy-900 font-inter bg-white p-3 rounded-lg border border-neutral-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mr-3">💰</div>
                      <div>
                        <div className="text-xs text-neutral-500">Agreed Price</div>
                        <div className="font-bold text-lg">{formatPrice(form.scopeBox.price, form.currency)}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-navy-900 font-inter bg-white p-3 rounded-lg border border-neutral-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">📅</div>
                      <div>
                        <div className="text-xs text-neutral-500">Target Deadline</div>
                        <div className="font-bold">{formatDeadline(form.scopeBox.deadline)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-navy-900 mb-4 border-b border-neutral-100 pb-2 flex items-center">
                  <span className="mr-2">📦</span> Order Specifications
                </h4>
                <div className="space-y-4 text-navy-900 font-inter">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                    <div>
                      <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-1">Project Title</span>
                      <div className="font-medium">{form.scopeBox.title}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-1">Product Type</span>
                      <div className="font-medium">{form.scopeBox.productType}</div>
                    </div>

                    {!(isLogoDesignSelected() || isPosterDesignSelected() || isSocialPostSelected() || isVideoEditingSelected() || isMotionGraphicsSelected() || isNftArtSelected() || isIllustrationSelected() || is3dModelingSelected() || isWebsiteDevelopmentSelected() || isGamingAccountSaleSelected() || isEcommercePhysicalItemSelected()) && (
                      <div>
                        <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-1">Condition</span>
                        <div className="font-medium">{form.scopeBox.condition}</div>
                      </div>
                    )}

                    {form.scopeBox.productLink && (
                      <div className="md:col-span-2">
                        <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-1">Reference Link</span>
                        <div className="font-medium break-all text-indigo-600 truncate">{form.scopeBox.productLink}</div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-1">Detailed Description</span>
                      <div className="font-medium text-sm text-neutral-700 bg-white p-3 rounded border border-neutral-200 whitespace-pre-wrap">{form.scopeBox.description}</div>
                    </div>

                    <div className="md:col-span-2 mt-2">
                      <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-2">Attached Files ({filePreviews.length})</span>
                      {filePreviews.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {filePreviews.map((f, idx) => (
                            <div key={idx} className="flex items-center text-xs bg-white border border-neutral-200 py-1.5 px-3 rounded-full shadow-sm text-navy-900">
                              <span className="mr-1.5 text-indigo-500">📎</span>
                              <span className="truncate max-w-[150px] font-medium">{f.name}</span>
                              <span className="text-neutral-400 ml-1.5">({formatFileSize(f.size)})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-neutral-400 italic text-sm">No files attached</div>
                      )}
                    </div>
                  </div>
                  {/* Logo Specific Details */}
                  {isLogoDesignSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🎨 Logo Specific Details:</div>
                      <div><b>Business Name:</b> {form.scopeBox.logoSpecific.businessName}</div>
                      <div><b>Keyword/Industry:</b> {form.scopeBox.logoSpecific.keywordIndustry}</div>
                      <div><b>Logo Style:</b> {form.scopeBox.logoSpecific.logoStyle}</div>
                      <div><b>Color Preferred:</b> {form.scopeBox.logoSpecific.colorPreferred}</div>
                    </div>
                  )}
                  {isPosterDesignSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🖼️ Poster/Flyer/Banner Details:</div>
                      <div><b>Size:</b> {form.scopeBox.posterSpecific.width} × {form.scopeBox.posterSpecific.height}</div>
                      <div><b>Resolution:</b> {form.scopeBox.posterSpecific.resolution}</div>
                      <div><b>Orientation:</b> {form.scopeBox.posterSpecific.orientation}</div>
                      <div><b>Design Style:</b> {form.scopeBox.posterSpecific.designStyle}</div>
                      <div><b>Brand Colors:</b> {form.scopeBox.posterSpecific.brandColors}</div>
                      <div><b>Fonts:</b> {form.scopeBox.posterSpecific.fonts}</div>
                      <div><b>Text Content:</b> {form.scopeBox.posterSpecific.textContent}</div>
                    </div>
                  )}
                  {isSocialPostSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">📱 Social Media Post Details:</div>
                      <div><b>Format:</b> {form.scopeBox.socialPostSpecific.postFormat}</div>
                      <div><b>Aspect Ratio:</b> {form.scopeBox.socialPostSpecific.aspectRatio}</div>
                      <div><b>Resolution:</b> {form.scopeBox.socialPostSpecific.resolution}</div>
                      <div><b>Post Count:</b> {form.scopeBox.socialPostSpecific.postCount}</div>
                      <div><b>Caption:</b> {form.scopeBox.socialPostSpecific.finalCaption}</div>
                      <div><b>Hashtags:</b> {form.scopeBox.socialPostSpecific.hashtags}</div>
                    </div>
                  )}
                  {isVideoEditingSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🎬 Video Editing Details:</div>
                      <div><b>Duration:</b> {form.scopeBox.videoEditingSpecific.duration}</div>
                      <div><b>Software:</b> {form.scopeBox.videoEditingSpecific.software}</div>
                      <div><b>Resolution:</b> {form.scopeBox.videoEditingSpecific.resolution}</div>
                      <div><b>Frame Rate:</b> {form.scopeBox.videoEditingSpecific.frameRate}</div>
                      <div><b>Format:</b> {form.scopeBox.videoEditingSpecific.format}</div>
                      <div><b>Audio Track:</b> {form.scopeBox.videoEditingSpecific.audioTrack}</div>
                      <div><b>Videos:</b> {form.scopeBox.videoEditingSpecific.videoCount}</div>
                      <div><b>Storyboard:</b> {form.scopeBox.videoEditingSpecific.storyboard}</div>
                    </div>
                  )}
                  {isMotionGraphicsSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🎞️ Motion Graphics Details:</div>
                      <div><b>Style:</b> {form.scopeBox.motionGraphicsSpecific.animationStyle}</div>
                      <div><b>Duration:</b> {form.scopeBox.motionGraphicsSpecific.duration}</div>
                      <div><b>Resolution:</b> {form.scopeBox.motionGraphicsSpecific.resolution}</div>
                      <div><b>Frame Rate:</b> {form.scopeBox.motionGraphicsSpecific.frameRate}</div>
                      <div><b>Format:</b> {form.scopeBox.motionGraphicsSpecific.format}</div>
                      <div><b>Audio/SFX:</b> {form.scopeBox.motionGraphicsSpecific.audioRequired}</div>
                      <div><b>Text/Caption:</b> {form.scopeBox.motionGraphicsSpecific.textRequired}</div>
                      <div><b>Storyboard (text):</b> {form.scopeBox.motionGraphicsSpecific.storyboardText || '—'}</div>
                      <div><b>Storyboard (PDF):</b> {form.scopeBox.motionGraphicsSpecific.storyboardPdf ? form.scopeBox.motionGraphicsSpecific.storyboardPdf.name : '—'}</div>
                      <div><b>Reference Files:</b> {(form.scopeBox.motionGraphicsSpecific.referenceFiles || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Brand Guidelines (PDF):</b> {form.scopeBox.motionGraphicsSpecific.brandGuidelinesPdf ? form.scopeBox.motionGraphicsSpecific.brandGuidelinesPdf.name : '—'}</div>
                    </div>
                  )}
                  {isNftArtSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🧬 NFT Art Details:</div>
                      <div><b>NFT Type:</b> {form.scopeBox.nftArtSpecific.nftType}{form.scopeBox.nftArtSpecific.nftType === 'Other' ? ` — ${form.scopeBox.nftArtSpecific.nftTypeOther}` : ''}</div>
                      <div><b>Artwork Style:</b> {form.scopeBox.nftArtSpecific.artworkStyle}{form.scopeBox.nftArtSpecific.artworkStyle === 'Other' ? ` — ${form.scopeBox.nftArtSpecific.artworkStyleOther}` : ''}</div>
                      <div><b>Resolution:</b> {form.scopeBox.nftArtSpecific.resolution === 'Custom' ? form.scopeBox.nftArtSpecific.resolutionCustom : form.scopeBox.nftArtSpecific.resolution}</div>
                      <div><b>File Format:</b> {form.scopeBox.nftArtSpecific.fileFormat}</div>
                      <div><b>Blockchain:</b> {form.scopeBox.nftArtSpecific.blockchain}{form.scopeBox.nftArtSpecific.blockchain === 'Other' ? ` — ${form.scopeBox.nftArtSpecific.blockchainOther}` : ''}</div>
                      <div><b>Metadata Required:</b> {form.scopeBox.nftArtSpecific.metadataRequired}</div>
                      <div><b># of Artworks:</b> {form.scopeBox.nftArtSpecific.numberOfArtworks}</div>
                      <div><b>Ownership Transfer:</b> {form.scopeBox.nftArtSpecific.ownershipTransfer}</div>
                      <div><b>Reference Files:</b> {(form.scopeBox.nftArtSpecific.refMoodboardFiles || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Style Guide (PDF):</b> {form.scopeBox.nftArtSpecific.styleGuidePdf ? (form.scopeBox.nftArtSpecific.styleGuidePdf.name || form.scopeBox.nftArtSpecific.styleGuidePdf) : '—'}</div>
                      <div><b>Metadata Template:</b> {form.scopeBox.nftArtSpecific.metadataTemplate ? (form.scopeBox.nftArtSpecific.metadataTemplate.name || form.scopeBox.nftArtSpecific.metadataTemplate) : '—'}</div>
                    </div>
                  )}
                  {isIllustrationSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🎨 Illustration/Comics Details:</div>
                      <div><b>Illustration Type:</b> {form.scopeBox.illustrationSpecific.illustrationType}{form.scopeBox.illustrationSpecific.illustrationType === 'Other' ? ` — ${form.scopeBox.illustrationSpecific.illustrationTypeOther}` : ''}</div>
                      <div><b>Artwork Style:</b> {form.scopeBox.illustrationSpecific.artworkStyle}{form.scopeBox.illustrationSpecific.artworkStyle === 'Other' ? ` — ${form.scopeBox.illustrationSpecific.artworkStyleOther}` : ''}</div>
                      <div><b># of Pages/Panels:</b> {form.scopeBox.illustrationSpecific.numberOfPages}</div>
                      <div><b>Resolution:</b> {form.scopeBox.illustrationSpecific.resolution === 'Custom' ? form.scopeBox.illustrationSpecific.resolutionCustom : form.scopeBox.illustrationSpecific.resolution}</div>
                      <div><b>File Format:</b> {form.scopeBox.illustrationSpecific.fileFormat}</div>
                      <div><b>Color Option:</b> {form.scopeBox.illustrationSpecific.colorOption}</div>
                      <div><b>Text/Dialogue Required:</b> {form.scopeBox.illustrationSpecific.textRequired}</div>
                      {form.scopeBox.illustrationSpecific.textRequired === 'Yes' && <div><b>Script/Dialogue:</b> {form.scopeBox.illustrationSpecific.scriptDialogue}</div>}
                      <div><b>Ownership Transfer:</b> {form.scopeBox.illustrationSpecific.ownershipTransfer}</div>
                      <div><b>Reference Files:</b> {(form.scopeBox.illustrationSpecific.refArtworkFiles || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Script/Storyboard:</b> {form.scopeBox.illustrationSpecific.scriptStoryboard ? (form.scopeBox.illustrationSpecific.scriptStoryboard.name || form.scopeBox.illustrationSpecific.scriptStoryboard) : '—'}</div>
                      <div><b>Guidelines (PDF):</b> {form.scopeBox.illustrationSpecific.guidelinesPdf ? (form.scopeBox.illustrationSpecific.guidelinesPdf.name || form.scopeBox.illustrationSpecific.guidelinesPdf) : '—'}</div>
                    </div>
                  )}
                  {is3dModelingSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🎯 3D Modeling/Rendering Details:</div>
                      <div><b>Model Type:</b> {form.scopeBox.model3dSpecific.modelType}{form.scopeBox.model3dSpecific.modelType === 'Other' ? ` — ${form.scopeBox.model3dSpecific.modelTypeOther}` : ''}</div>
                      <div><b>Level of Detail:</b> {form.scopeBox.model3dSpecific.detailLevel}</div>
                      <div><b>Rendering Quality:</b> {form.scopeBox.model3dSpecific.renderingQuality}</div>
                      <div><b>File Format:</b> {form.scopeBox.model3dSpecific.fileFormat}{form.scopeBox.model3dSpecific.fileFormat === 'Other' ? ` — ${form.scopeBox.model3dSpecific.fileFormatOther}` : ''}</div>
                      <div><b>Texture Required:</b> {form.scopeBox.model3dSpecific.textureRequired}</div>
                      {form.scopeBox.model3dSpecific.textureRequired === 'Yes' && <div><b>Texture Format:</b> {form.scopeBox.model3dSpecific.textureFormat}</div>}
                      <div><b>Animation Required:</b> {form.scopeBox.model3dSpecific.animationRequired}</div>
                      {form.scopeBox.model3dSpecific.animationRequired === 'Yes' && <div><b>Animation Duration:</b> {form.scopeBox.model3dSpecific.animationDuration} seconds</div>}
                      <div><b># of Views/Renders:</b> {form.scopeBox.model3dSpecific.numberOfViews}</div>
                      <div><b>Render Resolution:</b> {form.scopeBox.model3dSpecific.renderResolution === 'Custom' ? form.scopeBox.model3dSpecific.renderResolutionCustom : form.scopeBox.model3dSpecific.renderResolution}</div>
                      <div><b>Ownership Transfer:</b> {form.scopeBox.model3dSpecific.ownershipTransfer}</div>
                      <div><b>Reference Files:</b> {(form.scopeBox.model3dSpecific.refModelFiles || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Technical Drawings:</b> {form.scopeBox.model3dSpecific.technicalDrawings ? (form.scopeBox.model3dSpecific.technicalDrawings.name || form.scopeBox.model3dSpecific.technicalDrawings) : '—'}</div>
                      <div><b>Guidelines (PDF):</b> {form.scopeBox.model3dSpecific.guidelinesPdf ? (form.scopeBox.model3dSpecific.guidelinesPdf.name || form.scopeBox.model3dSpecific.guidelinesPdf) : '—'}</div>
                    </div>
                  )}
                  {isAppDevelopmentSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">📱 App Development Details:</div>
                      <div><b>App Type:</b> {form.scopeBox.appDevelopmentSpecific.appType}{form.scopeBox.appDevelopmentSpecific.appType === 'Other' ? ` — ${form.scopeBox.appDevelopmentSpecific.appTypeOther}` : ''}</div>
                      <div><b>Frameworks:</b> {form.scopeBox.appDevelopmentSpecific.developmentFrameworks.join(', ')}</div>
                      <div><b>Target OS & Versions:</b> {form.scopeBox.appDevelopmentSpecific.targetOsVersions.join(', ')}</div>
                      <div><b># of Screens:</b> {form.scopeBox.appDevelopmentSpecific.numberOfScreens}</div>
                      <div><b>Offline Functionality:</b> {form.scopeBox.appDevelopmentSpecific.offlineFunctionality}</div>
                      <div><b>User Authentication:</b> {form.scopeBox.appDevelopmentSpecific.userAuthentication}</div>
                      <div><b>Backend Responsibility:</b> {form.scopeBox.appDevelopmentSpecific.backendResponsibility}</div>
                      <div><b>Key Features:</b> {form.scopeBox.appDevelopmentSpecific.keyFeatures}</div>
                      <div><b>Third-party Integrations:</b> {form.scopeBox.appDevelopmentSpecific.thirdPartyIntegrations}</div>
                      <div><b>Security Requirements:</b> {form.scopeBox.appDevelopmentSpecific.securityRequirements.includes('Other') ? form.scopeBox.appDevelopmentSpecific.securityRequirements.filter(s => s !== 'Other').join(', ') + (form.scopeBox.appDevelopmentSpecific.securityRequirementsOther ? `, Other: ${form.scopeBox.appDevelopmentSpecific.securityRequirementsOther}` : '') : form.scopeBox.appDevelopmentSpecific.securityRequirements.join(', ')}</div>
                      <div><b>Performance Targets:</b> {form.scopeBox.appDevelopmentSpecific.performanceTargets}</div>
                      <div><b>Source Code Delivery:</b> {form.scopeBox.appDevelopmentSpecific.sourceCodeDelivery}</div>
                      <div><b>App Store Submission:</b> {form.scopeBox.appDevelopmentSpecific.appStoreSubmission}</div>
                      <div><b>Documentation:</b> {form.scopeBox.appDevelopmentSpecific.documentation}</div>
                      <div><b>UI/UX Mockups:</b> {(form.scopeBox.appDevelopmentSpecific.uiuxMockups || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Guidelines:</b> {form.scopeBox.appDevelopmentSpecific.guidelines ? (form.scopeBox.appDevelopmentSpecific.guidelines.name || form.scopeBox.appDevelopmentSpecific.guidelines) : '—'}</div>
                    </div>
                  )}
                  {/* Website Development Specific Details */}
                  {isWebsiteDevelopmentSelected() && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-lg">
                      <div className="text-cyan-400 font-semibold mb-2">🌐 Website Development Details:</div>
                      <div><b>Website Type:</b> {form.scopeBox.websiteDevelopmentSpecific.websiteType}{form.scopeBox.websiteDevelopmentSpecific.websiteType === 'Other' ? ` — ${form.scopeBox.websiteDevelopmentSpecific.websiteTypeOther}` : ''}</div>
                      <div><b>Technology Stack:</b> {form.scopeBox.websiteDevelopmentSpecific.technologyStack.join(', ')}</div>
                      <div><b>Number of Pages:</b> {form.scopeBox.websiteDevelopmentSpecific.numberOfPages}</div>
                      <div><b>Responsive Design:</b> {form.scopeBox.websiteDevelopmentSpecific.responsiveDesign}</div>
                      <div><b>Browser Compatibility:</b> {form.scopeBox.websiteDevelopmentSpecific.browserCompatibility.join(', ')}</div>
                      <div><b>Hosting Responsibility:</b> {form.scopeBox.websiteDevelopmentSpecific.hostingResponsibility}</div>
                      <div><b>Key Features:</b> {form.scopeBox.websiteDevelopmentSpecific.keyFeatures}</div>
                      <div><b>Admin Panel:</b> {form.scopeBox.websiteDevelopmentSpecific.adminPanel}</div>
                      <div><b>Third-party Integrations:</b> {form.scopeBox.websiteDevelopmentSpecific.thirdPartyIntegrations}</div>
                      <div><b>Security Requirements:</b> {form.scopeBox.websiteDevelopmentSpecific.securityRequirements.includes('Other') ? form.scopeBox.websiteDevelopmentSpecific.securityRequirements.filter(s => s !== 'Other').join(', ') + (form.scopeBox.websiteDevelopmentSpecific.securityRequirementsOther ? `, Other: ${form.scopeBox.websiteDevelopmentSpecific.securityRequirementsOther}` : '') : form.scopeBox.websiteDevelopmentSpecific.securityRequirements.join(', ')}</div>
                      <div><b>Code Ownership:</b> {form.scopeBox.websiteDevelopmentSpecific.codeOwnership}</div>
                      <div><b>Source Code Delivery:</b> {form.scopeBox.websiteDevelopmentSpecific.sourceCodeDelivery}</div>
                      <div><b>Documentation:</b> {form.scopeBox.websiteDevelopmentSpecific.documentation}</div>
                      <div><b>Wireframes/Mockups:</b> {(form.scopeBox.websiteDevelopmentSpecific.wireframes || []).map(f => f.name || f).join(', ') || '—'}</div>
                      <div><b>Guidelines:</b> {form.scopeBox.websiteDevelopmentSpecific.guidelines ? (form.scopeBox.websiteDevelopmentSpecific.guidelines.name || form.scopeBox.websiteDevelopmentSpecific.guidelines) : '—'}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center">
                  <span className="text-2xl mr-3">📞</span>
                  <div>
                    <span className="text-neutral-500 font-inter text-xs uppercase tracking-wider block mb-0.5">Seller Contact</span>
                    <div className="font-medium text-navy-900 font-inter">{form.sellerContact}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 w-full max-w-2xl mx-auto">
                  <button
                    className="px-6 py-4 border border-neutral-300 text-navy-900 bg-white rounded-xl font-medium transition-all duration-300 hover:bg-neutral-50 font-inter w-full sm:w-1/3 shadow-sm text-lg"
                    onClick={() => setStep(3)}
                  >
                    Back
                  </button>
                  <button
                    className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-inter w-full sm:w-2/3 text-lg flex items-center justify-center gap-2"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Order...
                      </>
                    ) : (
                      <>
                        Create Order & Secure Payment
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {error && <div className="text-red-600 text-sm mt-4 font-inter bg-red-50 border border-red-200 rounded-lg p-4 font-medium shadow-sm flex items-center"><span className="mr-2">⚠️</span> {error}</div>}
            </div>
          )}

          {/* Funding Modal */}
          {showFundingModal && orderData && (
            <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h3 className="text-2xl font-bold text-navy-900 font-inter mb-2">Fund Escrow</h3>
                  <p className="text-neutral-500 font-inter text-sm">
                    Complete payment to secure your order and notify the seller.
                  </p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 text-center shadow-inner">
                  <div className="text-sm text-neutral-500 font-inter mb-1">Total to Pay</div>
                  <div className="text-3xl font-bold text-navy-900 font-inter mb-3">{orderData.price}</div>
                  <div className="flex justify-between items-center text-sm font-inter text-neutral-600 border-t border-neutral-200 pt-3">
                    <span>Order ID: <span className="font-mono bg-white px-2 py-0.5 rounded border border-neutral-200">{orderData.orderId}</span></span>
                    <span className="text-amber-500 font-medium whitespace-nowrap px-2 py-1 bg-amber-50 rounded-full border border-amber-100 text-xs">Pending Payment</span>
                  </div>
                </div>

                <form onSubmit={handleFundingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 font-inter mb-1.5">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        value={fundingData.cardNumber}
                        onChange={handleFundingInput}
                        placeholder="0000 0000 0000 0000"
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-900 font-inter mb-1.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={fundingData.expiryDate}
                        onChange={handleFundingInput}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy-900 font-inter mb-1.5">
                        CVCC
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={fundingData.cvv}
                        onChange={handleFundingInput}
                        placeholder="123"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-900 font-inter mb-1.5">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={fundingData.cardholderName}
                      onChange={handleFundingInput}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white text-navy-900 placeholder-neutral-400 font-inter shadow-sm"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowFundingModal(false)}
                      className="flex-1 px-4 py-3 border border-neutral-300 bg-white hover:bg-neutral-50 text-navy-900 rounded-xl font-medium transition-all duration-300 font-inter"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={fundingLoading}
                      className="flex-[2] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-300 shadow-md font-inter disabled:opacity-50"
                    >
                      {fundingLoading ? 'Processing...' : `Pay ${orderData.price}`}
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-start gap-3">
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm font-inter">Bank-level Security</p>
                    <p className="text-xs text-neutral-500 font-inter mt-0.5">Your payment is encrypted and processed securely. Funds are held safely in escrow until you approve the final delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccess && orderData && (
            <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>

                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl shadow-sm">
                    ✓
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-navy-900 font-inter mb-2">Payment Successful!</h3>
                <p className="text-neutral-500 font-inter text-sm mb-6">
                  Your order has been created, funded, and the seller has been notified.
                </p>

                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mb-6 text-left shadow-inner">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200">
                    <span className="text-neutral-500 text-sm font-inter">Amount Paid</span>
                    <span className="font-bold text-navy-900 font-inter">{orderData.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral-500 text-sm font-inter">Order ID</span>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-neutral-200 text-navy-900">{orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-sm font-inter">Status</span>
                    <span className="text-green-600 font-medium text-xs px-2 py-0.5 bg-green-50 rounded-full border border-green-100 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span> Funded
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500 mb-8 bg-indigo-50 text-indigo-700 py-2 px-4 rounded-lg border border-indigo-100 font-inter">
                  <span>Redirecting to tracking...</span>
                  <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>

                <button className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors font-inter hidden">
                  View Order Tracking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}