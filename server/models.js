const mongoose = require("mongoose");

// 1. User Schema (for marketers)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 2. Customer Schema (E-commerce buyers)
const CustomerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  ordersCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastPurchaseDate: { type: Date, required: true },
  traits: [{ type: String }], // e.g. ["shoes-buyer", "inactive-30d", "high-value"]
  createdAt: { type: Date, default: Date.now }
});

// 3. Segment Schema
const SegmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ["manual", "ai"], default: "manual" },
  prompt: { type: String }, // Prompt if AI-generated
  filters: {
    minSpent: { type: Number },
    maxSpent: { type: Number },
    minOrders: { type: Number },
    traitsInclude: [{ type: String }],
    traitsExclude: [{ type: String }],
    lastPurchaseWithinDays: { type: Number },
    lastPurchaseOlderThanDays: { type: Number }
  },
  matchingCustomersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// 4. Campaign Schema
const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  channel: { type: String, enum: ["email", "whatsapp", "sms"], required: true },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Segment", required: true },
  status: { type: String, enum: ["draft", "sending", "completed"], default: "draft" },
  content: {
    subject: { type: String }, // For emails
    body: { type: String, required: true },
    cta: { type: String },
    tone: { type: String }
  },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

// 5. Message Log Schema (for individual deliveries)
const MessageLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  channel: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "OPENED", "CLICKED"], 
    default: "PENDING" 
  },
  updatedAt: { type: Date, default: Date.now }
});

// 6. Webhook Log Schema (for callbacks)
const WebhookLogSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  status: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  receivedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Customer = mongoose.model("Customer", CustomerSchema);
const Segment = mongoose.model("Segment", SegmentSchema);
const Campaign = mongoose.model("Campaign", CampaignSchema);
const MessageLog = mongoose.model("MessageLog", MessageLogSchema);
const WebhookLog = mongoose.model("WebhookLog", WebhookLogSchema);

module.exports = {
  User,
  Customer,
  Segment,
  Campaign,
  MessageLog,
  WebhookLog
};
