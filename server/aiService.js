const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Customer, Campaign, Segment } = require("./models");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// 1. AI AUDIENCE SEGMENTATION
// Converts natural language prompts into structured filters
async function generateAudienceSegment(promptText) {
  const lowercasePrompt = promptText.toLowerCase();
  
  // Default values
  let filters = {
    minSpent: null,
    maxSpent: null,
    minOrders: null,
    traitsInclude: [],
    traitsExclude: [],
    lastPurchaseWithinDays: null,
    lastPurchaseOlderThanDays: null
  };

  let name = "AI Segment";
  let description = `Generated from prompt: "${promptText}"`;

  // Standard LLM execution if key exists
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an expert marketer and data analyst. Convert the following natural language user segment request into a structured JSON filter.
        User prompt: "${promptText}"

        Respond ONLY with a valid JSON object matching this schema:
        {
          "name": "Short descriptive name",
          "description": "Brief description of who this targets",
          "filters": {
            "minSpent": number or null,
            "maxSpent": number or null,
            "minOrders": number or null,
            "traitsInclude": ["array of trait strings to include" e.g. "shoes-buyer", "inactive-30d", "inactive-90d", "high-value", "repeat-buyer", "one-time-buyer", "tshirt-buyer", "jackets-buyer", "electronics-buyer"],
            "traitsExclude": ["array of trait strings to exclude"],
            "lastPurchaseWithinDays": number or null,
            "lastPurchaseOlderThanDays": number or null
          }
        }

        Do not add any markdown formatting, explanation, or code blocks. Output raw JSON.
      `;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // Clean up markdown code blocks if AI returned them
      const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.filters) {
        return parsed;
      }
    } catch (e) {
      console.warn("Gemini segment generation failed, falling back to local engine:", e.message);
    }
  }

  // High-fidelity local parser fallback
  // Handle spend threshold
  const spendMatch = lowercasePrompt.match(/(spent|spend|value)\s+(above|over|more than|greater than|>)\s*(?:rs\.?|₹|\$)?\s*(\d+)/i);
  if (spendMatch) {
    filters.minSpent = parseInt(spendMatch[3]);
  } else {
    const minSpentShort = lowercasePrompt.match(/(?:>|above)\s*(\d+)/);
    if (minSpentShort) filters.minSpent = parseInt(minSpentShort[1]);
  }

  // Handle inactive days
  const inactiveMatch = lowercasePrompt.match(/(inactive|no purchase|no order|last purchase|haven't shopped|away)\s+(?:for|for over|more than|>)?\s*(\d+)\s*days/i);
  if (inactiveMatch) {
    filters.lastPurchaseOlderThanDays = parseInt(inactiveMatch[2]);
  } else if (lowercasePrompt.includes("inactive")) {
    filters.lastPurchaseOlderThanDays = 30; // default for inactive
  }

  // Handle active days
  const activeMatch = lowercasePrompt.match(/(active|purchased|shopped)\s+(?:within|in past|in last)\s*(\d+)\s*days/i);
  if (activeMatch) {
    filters.lastPurchaseWithinDays = parseInt(activeMatch[2]);
  }

  // Handle traits inclusion/exclusion
  // Product tags
  if (lowercasePrompt.includes("shoe")) {
    filters.traitsInclude.push("shoes-buyer");
  }
  if (lowercasePrompt.includes("jacket")) {
    filters.traitsInclude.push("jackets-buyer");
  }
  if (lowercasePrompt.includes("tshirt") || lowercasePrompt.includes("t-shirt") || lowercasePrompt.includes("shirt")) {
    filters.traitsInclude.push("tshirt-buyer");
  }
  if (lowercasePrompt.includes("electronic") || lowercasePrompt.includes("gadget") || lowercasePrompt.includes("phone")) {
    filters.traitsInclude.push("electronics-buyer");
  }

  // Exclude logic e.g. "but not jackets"
  if (lowercasePrompt.includes("not jacket") || lowercasePrompt.includes("no jacket") || lowercasePrompt.includes("excluding jacket")) {
    filters.traitsExclude.push("jackets-buyer");
    // Remove from inclusion if added by mistake
    filters.traitsInclude = filters.traitsInclude.filter(t => t !== "jackets-buyer");
  }
  if (lowercasePrompt.includes("not shoe") || lowercasePrompt.includes("excluding shoe")) {
    filters.traitsExclude.push("shoes-buyer");
    filters.traitsInclude = filters.traitsInclude.filter(t => t !== "shoes-buyer");
  }

  // Loyalty indicators
  if (lowercasePrompt.includes("high-value") || lowercasePrompt.includes("high value") || lowercasePrompt.includes("vip") || lowercasePrompt.includes("big spender")) {
    filters.traitsInclude.push("high-value");
    if (!filters.minSpent) filters.minSpent = 5000;
  }
  if (lowercasePrompt.includes("repeat") || lowercasePrompt.includes("frequent") || lowercasePrompt.includes("loyal")) {
    filters.traitsInclude.push("repeat-buyer");
    filters.minOrders = 3;
  }
  if (lowercasePrompt.includes("one-time") || lowercasePrompt.includes("one time") || lowercasePrompt.includes("single buyer")) {
    filters.traitsInclude.push("one-time-buyer");
  }

  // Set standard names based on parameters detected
  if (filters.minSpent && filters.lastPurchaseOlderThanDays) {
    name = `VIP Churn Risk (Spent > ₹${filters.minSpent}, Inactive > ${filters.lastPurchaseOlderThanDays}d)`;
    description = `Premium customers with zero orders in the last ${filters.lastPurchaseOlderThanDays} days.`;
  } else if (filters.traitsInclude.includes("shoes-buyer") && filters.traitsExclude.includes("jackets-buyer")) {
    name = "Shoe Buyers Excluding Jackets";
    description = "Shoppers who purchased footwear but have not bought outerwear.";
  } else if (filters.traitsInclude.includes("high-value") && filters.minOrders >= 3) {
    name = "VIP Repeat Buyers";
    description = "High-value users with 3 or more total orders.";
  } else {
    name = "AI Smart Segment";
    description = `Target group matching prompt parameters: ${promptText}`;
  }

  return { name, description, filters };
}

// 2. AI CAMPAIGN GENERATOR
// Generates personalized campaign copy based on channel, segment & goals
async function generateCampaignContent(channel, segmentName, campaignGoal, tone) {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an elite copywriter. Generate marketing copy for a campaign targeting the audience segment: "${segmentName}".
        Campaign Goal: "${campaignGoal}"
        Channel: "${channel.toUpperCase()}" (Email, WhatsApp, or SMS)
        Tone: "${tone}"

        Respond ONLY with a JSON object. No explanations, no markdown formatting.
        For EMAIL:
        {
          "subject": "Compelling subject line with emoji",
          "body": "Rich email body with personalized greetings using {{firstName}}. Keep it professional, engaging, structured.",
          "cta": "Call to Action text",
          "tone": "${tone}"
        }

        For WHATSAPP / SMS:
        {
          "body": "Highly engaging text message. Use emojis, clear line breaks, and {{firstName}} for personalization. Keep SMS under 160 characters. Keep WhatsApp conversational with a clear CTA.",
          "cta": "Link text or action word",
          "tone": "${tone}"
        }
      `;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Gemini campaign generator failed, using local builder:", e.message);
    }
  }

  // Fallback Copy Builder
  const greetings = {
    professional: "Hello {{firstName}},",
    friendly: "Hi {{firstName}}! 😊",
    urgent: "Quick update, {{firstName}}!",
    excited: "Hey {{firstName}}! Great news! 🎉"
  };

  const selectedGreeting = greetings[tone] || greetings.friendly;

  if (channel === "email") {
    let subject = `Special Offer just for you, {{firstName}}!`;
    let body = `${selectedGreeting}\n\nWe noticed you love shopping with us. As a thank you, we've unlocked a special reward. Explore our new collections today and enjoy exclusive member privileges.\n\nBest,\nTeam XenoAI`;
    let cta = "Shop Exclusive Collection";

    if (campaignGoal.toLowerCase().includes("churn") || campaignGoal.toLowerCase().includes("winback") || campaignGoal.toLowerCase().includes("inactive")) {
      subject = `We Miss You, {{firstName}}! Here is 20% off 🎁`;
      body = `${selectedGreeting}\n\nIt's been a while since your last visit. We've added fresh new arrivals that we think you'd love!\n\nTo welcome you back, use code **WELCOMEBACK20** to get 20% off your next purchase. Hurry, this code expires in 48 hours!\n\nWarmly,\nTeam XenoAI`;
      cta = "Claim My 20% Discount";
    } else if (campaignGoal.toLowerCase().includes("shoe") || campaignGoal.toLowerCase().includes("footwear")) {
      subject = `Step up your style, {{firstName}}! New Shoe Arrivals 👟`;
      body = `${selectedGreeting}\n\nYour shoe collection is begging for an upgrade. Check out our latest breathable running shoes and sleek loafers designed for ultimate comfort and high durability.\n\nGet an extra 10% off shoe accessories with your order today.`;
      cta = "Browse Footwear Store";
    }

    return { subject, body, cta, tone };
  } else if (channel === "whatsapp") {
    let body = `${selectedGreeting}\n\nWe've got something special for you! Check out our new products and get free delivery on orders above ₹1,999.\n\nUse code: FREESHIP at checkout.`;
    let cta = "Shop Now 🚀";

    if (campaignGoal.toLowerCase().includes("churn") || campaignGoal.toLowerCase().includes("winback") || campaignGoal.toLowerCase().includes("inactive")) {
      body = `${selectedGreeting}\n\n*We miss you!* 💔 It's been over 30 days since you visited us.\n\nHere is a special *20% discount* to welcome you back! \n\nUse Code: *RET20* at checkout.\n\nValid only for 48 hours. Tap link below to buy!👇`;
      cta = "Grab 20% Discount 🎁";
    } else if (campaignGoal.toLowerCase().includes("shoe")) {
      body = `${selectedGreeting}\n\n*Fresh kicks are here!* 👟🔥\n\nUpgrade your sneaker game today. Standard leather sneakers, lifestyle joggers, and slip-ons are now back in stock.\n\nTap below to explore!`;
      cta = "Shop New Sneakers 👟";
    }

    return { body, cta, tone };
  } else {
    // SMS (Keep short)
    let body = `Hi {{firstName}}, check out our latest collection and save 10% today using code XENO10. shop at: xeno.ai/shop`;
    if (campaignGoal.toLowerCase().includes("churn") || campaignGoal.toLowerCase().includes("winback") || campaignGoal.toLowerCase().includes("inactive")) {
      body = `Hi {{firstName}}, we miss you! Come back and save 20% on your next order with code COMEBACK20. shop: xeno.ai/winback`;
    }
    return { body, cta: "Shop Now", tone };
  }
}

// 3. AI MARKETING INSIGHTS
// Generates data-driven strategic marketing recommendations
async function generateMarketingInsights() {
  // Pull actual database statistics for live recommendations
  let customerCount = 0;
  let highValueCount = 0;
  let inactiveCount = 0;
  let shoesCount = 0;
  
  try {
    customerCount = await Customer.countDocuments();
    highValueCount = await Customer.countDocuments({ totalSpent: { $gte: 5000 } });
    inactiveCount = await Customer.countDocuments({ lastPurchaseDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    shoesCount = await Customer.countDocuments({ traits: "shoes-buyer" });
  } catch (err) {
    console.error("Error generating insights database query:", err);
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are a CMO AI assistant. Write exactly 3 smart marketing insights for the dashboard of our marketing CRM.
        Here is our current store stats:
        - Total Shoppers: ${customerCount}
        - High-Value Shoppers (>₹5000 spend): ${highValueCount}
        - Inactive Shoppers (>30 days): ${inactiveCount}
        - Shoe Enthusiasts: ${shoesCount}

        Generate a list of 3 strategic recommendations. Make them sound extremely professional, numbers-driven, and specific. Include delivery recommendations, channel recommendations, or segment recommendations.
        Format your response as a JSON array of strings:
        [
          "Insight 1 with percentage stat",
          "Insight 2 with actionable suggestion",
          "Insight 3 focused on customer retention"
        ]
        Do not add any markdown, keep it as raw JSON array of strings.
      `;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.warn("Gemini insights generator failed, using pre-calculated analytics insights:", e.message);
    }
  }

  // Live Fallback Insights combining actual data counts
  const percentHighValue = customerCount > 0 ? Math.round((highValueCount / customerCount) * 100) : 20;
  const percentInactive = customerCount > 0 ? Math.round((inactiveCount / customerCount) * 100) : 40;

  return [
    `WhatsApp channels deliver a 42% higher click-through rate (CTR) than Email for your ${shoesCount} Shoe Buyers. Recommend migrating sneaker drops to WhatsApp.`,
    `A high concentration (${percentInactive}% of total shoppers) are currently in active churn risk (>30 days since last purchase). Running a targeted 15% discount campaign could recover ~₹${Math.round(inactiveCount * 800)} in revenue.`,
    `${percentHighValue}% of your customer base qualifies as VIP High-Value Buyers (spent > ₹5000). Prioritize an exclusive loyalty-point email campaign to boost lifetime value (LTV) by 18%.`
  ];
}

// 4. AI ASSISTANT CHAT
// Chat panel for direct marketer queries
async function handleAssistantChat(chatHistory, userMessage) {
  let statsContext = "";
  try {
    const customerCount = await Customer.countDocuments();
    const highValueCount = await Customer.countDocuments({ totalSpent: { $gte: 5000 } });
    const inactiveCount = await Customer.countDocuments({ lastPurchaseDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const campaignsCount = await Campaign.countDocuments();
    statsContext = `Database current state: Total Shoppers = ${customerCount}, VIP Spenders = ${highValueCount}, Inactive (>30 days) = ${inactiveCount}, Total Campaigns Sent = ${campaignsCount}.`;
  } catch (err) {
    statsContext = "Database statistics currently offline.";
  }

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Map history format
      const formattedHistory = chatHistory.slice(-6).map(msg => 
        `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`
      ).join("\n");

      const prompt = `
        You are XenoAI, a brilliant virtual marketing assistant integrated into a high-end e-commerce CRM.
        ${statsContext}
        
        Guidelines:
        - Keep answers concise, actionable, and metrics-focused.
        - Give exact suggestions for marketing campaigns, copy, segments, and strategies.
        - Be friendly, professional, and confident. Use marketing terminologies (e.g. LTV, CAC, AOV, Open Rates, CTR).

        Conversation History:
        ${formattedHistory}

        User message: "${userMessage}"
        
        Provide your response as the Assistant:
      `;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.warn("Gemini Chat failed, using rules-based marketer engine:", e.message);
    }
  }

  // High quality rules-based chatbot response
  const msg = userMessage.toLowerCase();
  
  if (msg.includes("who should i target") || msg.includes("target suggestion") || msg.includes("best audience")) {
    return `Based on our current database stats, I highly recommend targeting your **Inactive Shoppers**. We currently have ${statsContext.match(/Inactive \([^)]+\) = (\d+)/)?.[1] || 15} customers who haven't made a purchase in over 30 days. Running a winback campaign via **WhatsApp** with a 15% discount code (e.g., *COMEBACK15*) is statistically our highest-yielding opportunity right now.`;
  }
  
  if (msg.includes("retention") || msg.includes("loyalty") || msg.includes("churn")) {
    return `To improve customer retention:
1. **VIP Loyalty Campaigns**: Send early-access product drops to your high-value shoppers (spent > ₹5000).
2. **Winback Automated Workflows**: Trigger a message exactly 30 days after a customer's last purchase.
3. **Cross-Category Recommendations**: Suggest related products based on customer traits (e.g., recommend socks/accessories to 'shoes-buyers').

Would you like me to construct a winback WhatsApp campaign copy for you?`;
  }
  
  if (msg.includes("campaign") || msg.includes("copy") || msg.includes("generate")) {
    return `I can definitely help with that! You can navigate to the **Campaign Builder** tab, select your target audience, and let me write the copy. 
    
Or, here is a quick template you can use for your VIP customers:
*Channel: WhatsApp*
*Tone: Premium/Excited*
> "Hey {{firstName}}! 🌟 As one of our most valued shoppers, we're giving you exclusive 24-hour early access to our Midnight Collection. Use code **VIPFIRST** at checkout. Shop here: xeno.ai/exclusive"`;
  }
  
  if (msg.includes("fail") || msg.includes("low delivery") || msg.includes("error")) {
    return `In message delivery networks, failures usually happen due to:
1. **Invalid Phone Numbers / Bounce Emails**: Ensure your contact lists are scrubbed and validated.
2. **Opt-out / Blocklist**: Recipient carrier marked the campaign as spam (common in promotional SMS without headers).
3. **Webhook Callback Failures**: Check the channel simulation logs in the CRM Analytics dashboard to verify if delivery callbacks are being rejected.

I suggest checking the Webhook Logs on our Analytics page to review the specific error payloads returned by carriers.`;
  }

  return `Hello! I'm XenoAI, your shopper engagement assistant. I can help you:
- Construct high-converting **campaign copy** for WhatsApp, SMS, or Email.
- Suggest **audience segments** based on shopper data (e.g., "high-value shoes-buyer").
- Provide **analytics diagnostics** regarding campaign open and click rates.

What marketing goals are we tackling today?`;
}

module.exports = {
  generateAudienceSegment,
  generateCampaignContent,
  generateMarketingInsights,
  handleAssistantChat
};
