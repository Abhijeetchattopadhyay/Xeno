const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
require("dotenv").config();

const { connectDB } = require("./db");
const { User, Customer, Segment, Campaign, MessageLog, WebhookLog } = require("./models");
const { 
  generateAudienceSegment, 
  generateCampaignContent, 
  generateMarketingInsights, 
  handleAssistantChat 
} = require("./aiService");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected to socket:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.set("io", io);

// Connect to Database
connectDB();

// JWT Authentication Middleware
const JWT_SECRET = process.env.JWT_SECRET || "xenoai-super-secret-key";

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 2. CUSTOMER ROUTES
// ==========================================

// Helper to translate Segment filter values into MongoDB query
const buildMongoQuery = (filters) => {
  const query = {};
  if (!filters) return query;

  if (filters.minSpent !== null && filters.minSpent !== undefined) {
    query.totalSpent = query.totalSpent || {};
    query.totalSpent.$gte = filters.minSpent;
  }
  if (filters.maxSpent !== null && filters.maxSpent !== undefined) {
    query.totalSpent = query.totalSpent || {};
    query.totalSpent.$lte = filters.maxSpent;
  }
  if (filters.minOrders !== null && filters.minOrders !== undefined) {
    query.ordersCount = { $gte: filters.minOrders };
  }
  if (filters.traitsInclude && filters.traitsInclude.length > 0) {
    query.traits = query.traits || {};
    query.traits.$all = filters.traitsInclude;
  }
  if (filters.traitsExclude && filters.traitsExclude.length > 0) {
    query.traits = query.traits || {};
    query.traits.$nin = filters.traitsExclude;
  }

  const now = new Date();
  if (filters.lastPurchaseWithinDays !== null && filters.lastPurchaseWithinDays !== undefined) {
    const cutOff = new Date();
    cutOff.setDate(now.getDate() - filters.lastPurchaseWithinDays);
    query.lastPurchaseDate = query.lastPurchaseDate || {};
    query.lastPurchaseDate.$gte = cutOff;
  }
  if (filters.lastPurchaseOlderThanDays !== null && filters.lastPurchaseOlderThanDays !== undefined) {
    const cutOff = new Date();
    cutOff.setDate(now.getDate() - filters.lastPurchaseOlderThanDays);
    query.lastPurchaseDate = query.lastPurchaseDate || {};
    query.lastPurchaseDate.$lt = cutOff;
  }
  return query;
};

app.get("/api/customers", authenticate, async (req, res) => {
  try {
    const { search, trait, minSpent, limit = 50, page = 1 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }

    if (trait) {
      query.traits = trait;
    }

    if (minSpent) {
      query.totalSpent = { $gte: parseFloat(minSpent) };
    }

    const skip = (page - 1) * limit;
    const items = await Customer.find(query)
      .sort({ totalSpent: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Customer.countDocuments(query);

    res.json({
      customers: items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. SEGMENT ROUTES
// ==========================================

app.get("/api/segments", authenticate, async (req, res) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    res.json(segments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/segments/ai-parse", authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required." });

    const segmentData = await generateAudienceSegment(prompt);
    
    // Calculate matching customers count dynamically
    const query = buildMongoQuery(segmentData.filters);
    const count = await Customer.countDocuments(query);
    segmentData.matchingCustomersCount = count;

    res.json(segmentData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/segments/create", authenticate, async (req, res) => {
  try {
    const { name, description, type, prompt, filters } = req.body;
    
    // Dynamically calculate final count before saving
    const query = buildMongoQuery(filters);
    const count = await Customer.countDocuments(query);

    const segment = await Segment.create({
      name,
      description,
      type,
      prompt,
      filters,
      matchingCustomersCount: count
    });

    res.status(201).json(segment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. CAMPAIGN ROUTES
// ==========================================

app.get("/api/campaigns", authenticate, async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("segmentId").sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/campaigns/:id", authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate("segmentId");
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/campaigns/create", authenticate, async (req, res) => {
  try {
    const { name, channel, segmentId, content } = req.body;
    const campaign = await Campaign.create({
      name,
      channel,
      segmentId,
      content,
      status: "draft"
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/campaigns/:id/send", authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });

    const segment = await Segment.findById(campaign.segmentId);
    if (!segment) return res.status(404).json({ message: "Segment not found." });

    const query = buildMongoQuery(segment.filters);
    const recipients = await Customer.find(query);

    if (recipients.length === 0) {
      return res.status(400).json({ message: "Cannot send campaign: Audience segment is empty." });
    }

    // Set status to sending
    campaign.status = "sending";
    campaign.stats.total = recipients.length;
    campaign.stats.sent = 0;
    campaign.stats.delivered = 0;
    campaign.stats.opened = 0;
    campaign.stats.clicked = 0;
    campaign.stats.failed = 0;
    await campaign.save();

    // Create MessageLog entries
    const messageLogs = recipients.map(cust => ({
      campaignId: campaign._id,
      customerId: cust._id,
      channel: campaign.channel,
      status: "PENDING"
    }));
    const savedLogs = await MessageLog.insertMany(messageLogs);

    // Call channel-service to simulate dispatches
    // Format dispatch payload
    const dispatchRecipients = savedLogs.map((log, idx) => {
      const cust = recipients[idx];
      return {
        messageId: log._id,
        firstName: cust.firstName,
        lastName: cust.lastName,
        email: cust.email,
        phone: cust.phone,
        body: campaign.content.body.replace(/\{\{firstName\}\}/g, cust.firstName)
      };
    });

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || "http://localhost:5001/api/send";

    // Trigger simulation in background, don't wait for completion of timeouts
    axios.post(channelServiceUrl, {
      campaignId: campaign._id,
      channel: campaign.channel,
      callbackUrl: `http://localhost:${process.env.PORT || 5000}/api/webhooks/delivery`,
      recipients: dispatchRecipients
    }).catch(err => {
      console.error("Failed to connect to Channel Simulation Service at:", channelServiceUrl, err.message);
    });

    res.json({ message: "Campaign dispatch triggered successfully.", recipientsCount: recipients.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/campaigns/:id/logs", authenticate, async (req, res) => {
  try {
    const logs = await MessageLog.find({ campaignId: req.params.id })
      .populate("customerId")
      .sort({ updatedAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 5. WEBHOOK CALLBACK ROUTE (From Channel Service)
// ==========================================

app.post("/api/webhooks/delivery", async (req, res) => {
  try {
    const { messageId, status, payload } = req.body;
    if (!messageId || !status) {
      return res.status(400).json({ message: "Missing messageId or status." });
    }

    // Save WebhookLog
    await WebhookLog.create({ messageId, status, payload });

    // Find and update the message log
    const log = await MessageLog.findById(messageId);
    if (!log) {
      return res.status(404).json({ message: "Message log record not found." });
    }
    
    log.status = status;
    log.updatedAt = new Date();
    await log.save();

    // Re-calculate Campaign cumulative stats
    const campaign = await Campaign.findById(log.campaignId);
    if (campaign) {
      const total = await MessageLog.countDocuments({ campaignId: campaign._id });
      const sent = await MessageLog.countDocuments({ campaignId: campaign._id, status: { $in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] } });
      const delivered = await MessageLog.countDocuments({ campaignId: campaign._id, status: { $in: ["DELIVERED", "OPENED", "CLICKED"] } });
      const opened = await MessageLog.countDocuments({ campaignId: campaign._id, status: { $in: ["OPENED", "CLICKED"] } });
      const clicked = await MessageLog.countDocuments({ campaignId: campaign._id, status: "CLICKED" });
      const failed = await MessageLog.countDocuments({ campaignId: campaign._id, status: "FAILED" });

      campaign.stats = { total, sent, delivered, opened, clicked, failed };

      // Mark completed if every message has terminated (DELIVERED, CLICKED, OPENED or FAILED)
      // Since DELIVERED status transitions to OPENED/CLICKED, checking delivered + failed equals total
      if (delivered + failed >= total) {
        campaign.status = "completed";
      } else {
        campaign.status = "sending";
      }

      await campaign.save();

      // Emit live updates to frontend clients
      const io = req.app.get("io");
      io.emit("delivery-update", {
        messageId: log._id,
        campaignId: campaign._id,
        status: log.status,
        stats: campaign.stats,
        campaignStatus: campaign.status,
        customerName: payload?.customerName || "Customer"
      });
    }

    res.json({ success: true, message: "Webhook processed and Socket.IO broadcast dispatched." });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 6. ANALYTICS & MONITORING ROUTES
// ==========================================

app.get("/api/analytics/kpis", authenticate, async (req, res) => {
  try {
    const totalShoppers = await Customer.countDocuments();
    const activeSegments = await Segment.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: { $in: ["sending", "completed"] } });

    // Calculate sum of revenue
    const revenueStats = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: "$totalSpent" } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Calculate aggregated campaign metrics
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: "$stats.total" },
          totalSent: { $sum: "$stats.sent" },
          totalDelivered: { $sum: "$stats.delivered" },
          totalOpened: { $sum: "$stats.opened" },
          totalClicked: { $sum: "$stats.clicked" },
          totalFailed: { $sum: "$stats.failed" }
        }
      }
    ]);

    const cStats = campaignStats[0] || { totalMessages: 0, totalSent: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0, totalFailed: 0 };

    res.json({
      totalShoppers,
      activeSegments,
      activeCampaigns,
      totalRevenue,
      deliveryStats: cStats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/analytics/webhook-logs", authenticate, async (req, res) => {
  try {
    const logs = await WebhookLog.find().sort({ receivedAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 7. AI SERVICES ROUTES
// ==========================================

app.post("/api/ai/chat", authenticate, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required." });
    
    const reply = await handleAssistantChat(history || [], message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/ai/generate-campaign", authenticate, async (req, res) => {
  try {
    const { channel, segmentName, goal, tone } = req.body;
    if (!channel || !segmentName || !goal) {
      return res.status(400).json({ message: "Channel, segmentName, and goal are required." });
    }

    const content = await generateCampaignContent(channel, segmentName, goal, tone || "friendly");
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/ai/insights", authenticate, async (req, res) => {
  try {
    const insights = await generateMarketingInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CRM Service server running on http://localhost:${PORT}`);
});