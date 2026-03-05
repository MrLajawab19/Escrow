const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      reply: "⚠️ Please provide a valid message." 
    });
  }

  try {
    let reply = "";
    const systemInstruction = "You are EscrowX Support. Only answer questions related to EscrowX platform, disputes, escrow payments, order management, buyer/seller issues, account problems, or customer support. If asked anything else, politely decline and redirect to EscrowX-related topics. Keep responses helpful, professional, and concise.";

    if (process.env.GEMINI_API_KEY) {
      // Use Google Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `${systemInstruction}\n\nUser question: ${message}`;
      const result = await model.generateContent(prompt);
      reply = result.response.text();
      
    } else if (process.env.OPENAI_API_KEY) {
      // Use OpenAI GPT
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      reply = completion.choices[0].message.content;
      
    } else {
      reply = "⚠️ No AI API key configured. Please add GEMINI_API_KEY or OPENAI_API_KEY to your environment variables.";
    }

    // Clean up the reply and ensure it's not too long
    reply = reply.trim();
    if (reply.length > 500) {
      reply = reply.substring(0, 497) + "...";
    }

    res.json({ reply });

  } catch (error) {
    console.error("Support Chat Error:", error);
    
    // Provide different error messages based on error type
    let errorMessage = "⚠️ Sorry, something went wrong with support. Please try again.";
    
    if (error.message && error.message.includes('API key')) {
      errorMessage = "⚠️ AI service configuration error. Please contact administrator.";
    } else if (error.message && error.message.includes('quota')) {
      errorMessage = "⚠️ Service temporarily unavailable. Please try again later.";
    } else if (error.message && error.message.includes('network')) {
      errorMessage = "⚠️ Network error. Please check your connection and try again.";
    }

    res.json({ reply: errorMessage });
  }
});

module.exports = router;
