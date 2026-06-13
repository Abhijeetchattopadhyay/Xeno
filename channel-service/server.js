const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Global queue to show active simulations in a simple API dashboard
let activeSimulations = [];

app.get("/", (req, res) => {
  res.json({
    service: "XenoAI Channel Simulation Service",
    status: "online",
    activeQueueLength: activeSimulations.length,
    activeSimulations: activeSimulations.slice(-10) // Show last 10
  });
});

app.post("/api/send", async (req, res) => {
  try {
    const { campaignId, channel, callbackUrl, recipients } = req.body;

    if (!campaignId || !channel || !callbackUrl || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ message: "Invalid payload parameters." });
    }

    console.log(`\n=============================================`);
    console.log(`[DISPATCH] Campaign ID: ${campaignId} | Channel: ${channel}`);
    console.log(`[RECIPIENTS] Total queued: ${recipients.length}`);
    console.log(`[CALLBACK URL] ${callbackUrl}`);
    console.log(`=============================================\n`);

    res.json({ success: true, message: `Processing ${recipients.length} messages...` });

    // Process each recipient asynchronously in the background
    recipients.forEach((recipient) => {
      simulateDelivery(recipient, channel, callbackUrl, campaignId);
    });

  } catch (err) {
    console.error("Simulation error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// Helper for sending webhook callbacks
const fireCallback = async (callbackUrl, messageId, status, customerName, details = {}) => {
  try {
    console.log(`[WEBHOOK] messageId: ${messageId} -> Status: ${status} for ${customerName}`);
    await axios.post(callbackUrl, {
      messageId,
      status,
      payload: {
        customerName,
        timestamp: new Date(),
        ...details
      }
    });
  } catch (err) {
    console.error(`[WEBHOOK ERROR] Failed calling webhook callback for ${messageId}:`, err.message);
  }
};

const simulateDelivery = (recipient, channel, callbackUrl, campaignId) => {
  const { messageId, firstName, lastName, phone, email } = recipient;
  const fullName = `${firstName} ${lastName}`;
  const address = channel === "email" ? email : phone;

  const simId = `${messageId}_${Date.now()}`;
  const simRecord = {
    id: simId,
    customer: fullName,
    address,
    channel,
    status: "PENDING",
    startedAt: new Date()
  };
  activeSimulations.push(simRecord);

  // 1. SENT immediately
  setTimeout(async () => {
    simRecord.status = "SENT";
    await fireCallback(callbackUrl, messageId, "SENT", fullName);

    // 2. DELIVERED or FAILED (after 1.5s)
    setTimeout(async () => {
      // 8% chance of failure (e.g. invalid phone number, bounced email, server error)
      const isFailed = Math.random() < 0.08;

      if (isFailed) {
        simRecord.status = "FAILED";
        await fireCallback(callbackUrl, messageId, "FAILED", fullName, { 
          reason: channel === "email" ? "Bounce: Invalid inbox address" : "Carrier reject: Unreachable handset" 
        });
        // Remove from active simulation list
        activeSimulations = activeSimulations.filter(s => s.id !== simId);
      } else {
        simRecord.status = "DELIVERED";
        await fireCallback(callbackUrl, messageId, "DELIVERED", fullName);

        // 3. OPENED (after another 1.5s - total 3.0s)
        // High open rates on WhatsApp/Email (~65%), slightly lower on SMS (~35%)
        const openChance = channel === "sms" ? 0.35 : 0.65;
        const isOpened = Math.random() < openChance;

        if (isOpened) {
          setTimeout(async () => {
            simRecord.status = "OPENED";
            await fireCallback(callbackUrl, messageId, "OPENED", fullName);

            // 4. CLICKED (after another 1.5s - total 4.5s)
            // WhatsApp has great CTR (~40%), email is ~25%, SMS is ~15%
            const clickChance = channel === "whatsapp" ? 0.40 : channel === "email" ? 0.25 : 0.15;
            const isClicked = Math.random() < clickChance;

            if (isClicked) {
              setTimeout(async () => {
                simRecord.status = "CLICKED";
                await fireCallback(callbackUrl, messageId, "CLICKED", fullName);
                
                // Done simulation
                activeSimulations = activeSimulations.filter(s => s.id !== simId);
              }, 1500);
            } else {
              // Done simulation (Opened but not clicked)
              activeSimulations = activeSimulations.filter(s => s.id !== simId);
            }
          }, 1500);
        } else {
          // Done simulation (Delivered but not opened)
          activeSimulations = activeSimulations.filter(s => s.id !== simId);
        }
      }
    }, 1500);
  }, 100);
};

app.listen(PORT, () => {
  console.log(`Channel Simulation Service running on http://localhost:${PORT}`);
});
