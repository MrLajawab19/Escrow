/**
 * disputeAI.js
 * AI engine for generating universal dispute recommendations across all products.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

const analyzeDisputeWithAI = async ({ order, dispute, ruleEngineResult, chatMessages }) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Format chat history
    let formattedChat = "No chat history available.";
    if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
      formattedChat = chatMessages.map(m => {
        const sender = m.senderId === order.buyerId ? 'Buyer' : (m.senderId === order.sellerId ? 'Seller' : 'System');
        return `[${new Date(m.timestamp).toISOString()}] ${sender}: ${m.text}`;
      }).join("\n");
    }

    // Format delivery files
    const delivery = (order.deliveryFiles || []).map(f => f.fileName || f.url || 'Unknown File').join(", ");
    
    // Inject specific product category rules
    let categoryRules = '';
    switch (ruleEngineResult?.category) {
      case 'CONTENT':
        categoryRules = `Focus heavily on if the delivered text matches the required word count, topic, and plagiarism constraints. Note that rule engine flagged ${ruleEngineResult.flags.length} issues.`;
        break;
      case 'DESIGN':
        categoryRules = `Focus on if the correct file formats (e.g. source files, vector formats) and resolutions were delivered.`;
        break;
      case 'VIDEO':
        categoryRules = `Focus on if the video duration, format, and frame rates meet the requested requirements.`;
        break;
      case 'DEV':
        categoryRules = `Focus on if the delivered code runs, the correct tech stack was used, and if source code was provided.`;
        break;
      case 'SOCIAL':
        categoryRules = `Focus on screenshot evidence of promotion or growth. Metrics are critical here.`;
        break;
      case 'PHYSICAL':
        categoryRules = `Focus on valid tracking IDs, shipping proof, and condition upon arrival.`;
        break;
      case 'GAMING':
        categoryRules = `Focus on login credentials validity and screenshots of the account stats/inventory.`;
        break;
      default:
        categoryRules = `Analyze the general scope requirements against the delivery.`;
    }

    const prompt = `
You are the elite Escrow AI arbiter for ScrowX, dealing with a ${ruleEngineResult?.productType || 'Service'} dispute.
Analyze this dispute impartially. You must return your analysis as a strict JSON object with no markdown wrapping.

--- ORDER DETAILS ---
Category: ${ruleEngineResult?.category || 'GENERAL'}
Product/Service Type: ${ruleEngineResult?.productType || 'Unknown'}
Scope/Description: ${order.scopeBox?.description || order.scopeBox?.title || 'None provided'}
Deadline: ${order.scopeBox?.deadline || 'None'}
Amount: ${order.currency} ${order.amount}

--- DELIVERY DETAILS ---
Files Uploaded: ${delivery || 'None'}

--- DISPUTE DETAILS ---
Reason: ${dispute.reason}
Description: ${dispute.description}

--- CHAT HISTORY ---
${formattedChat}

--- RULE ENGINE PRE-ANALYSIS ---
Risk Score: ${ruleEngineResult?.riskScore || 0}/100
Flags: ${JSON.stringify(ruleEngineResult?.flags || [])}
Auto Recommendation: ${ruleEngineResult?.autoRecommendation || 'UNKNOWN'}
Category Rules: ${categoryRules}

Analyze the situation. Who is likely at fault? Should the buyer be refunded or the seller released the funds?

EXPECTED JSON FORMAT:
{
  "faultSide": "BUYER" | "SELLER" | "NEUTRAL",
  "recommendation": "REFUND_BUYER" | "RELEASE_TO_SELLER" | "MANUAL_REVIEW_REQUIRED",
  "confidenceScore": <number 0-100>,
  "reasoning": "<1-2 sentence explanation of the AI's logic based strictly on the facts>"
}
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Dispute Analysis Error:", error);
    return {
      faultSide: 'UNKNOWN',
      recommendation: 'MANUAL_REVIEW_REQUIRED',
      confidenceScore: 0,
      reasoning: 'Failed to generate AI analysis due to an internal error or rate limit.'
    };
  }
};

module.exports = {
  analyzeDisputeWithAI
};
