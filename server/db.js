const mongoose = require("mongoose");
const { Customer, Segment, User } = require("./models");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/xenoai";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully to:", MONGODB_URI);
    await seedDatabase();
  } catch (error) {
    console.error("MongoDB connection failed. Please ensure mongod is running or set MONGODB_URI in your environment:", error.message);
  }
};

const seedDatabase = async () => {
  try {
    // Seed default User
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        name: "Abhijeet Chattopadhyay",
        email: "cmo@xenoai.com",
        password: hashedPassword
      });
      console.log("Seeded default marketer user: cmo@xenoai.com / password123");
    }

    const customerCount = await Customer.countDocuments();
    if (customerCount > 0) {
      console.log(`Database already has ${customerCount} customers. Skipping seed.`);
      return;
    }

    console.log("Seeding initial shopper data...");

    // Helper to calculate relative date
    const daysAgo = (days) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    };

    const mockCustomers = [
      // High value buyers
      { firstName: "Aarav", lastName: "Sharma", email: "aarav.sharma@example.com", phone: "+919876543210", ordersCount: 12, totalSpent: 18500, lastPurchaseDate: daysAgo(3), traits: ["high-value", "repeat-buyer", "shoes-buyer"] },
      { firstName: "Priya", lastName: "Patel", email: "priya.patel@example.com", phone: "+919876543211", ordersCount: 8, totalSpent: 12400, lastPurchaseDate: daysAgo(5), traits: ["high-value", "repeat-buyer", "jackets-buyer"] },
      { firstName: "Vikram", lastName: "Singh", email: "vikram.singh@example.com", phone: "+919876543212", ordersCount: 15, totalSpent: 22000, lastPurchaseDate: daysAgo(2), traits: ["high-value", "repeat-buyer", "electronics-buyer"] },
      { firstName: "Sarah", lastName: "Connor", email: "sarah.connor@example.com", phone: "+15551234567", ordersCount: 6, totalSpent: 8900, lastPurchaseDate: daysAgo(12), traits: ["high-value", "jackets-buyer"] },
      { firstName: "Amit", lastName: "Verma", email: "amit.verma@example.com", phone: "+919876543213", ordersCount: 9, totalSpent: 14500, lastPurchaseDate: daysAgo(4), traits: ["high-value", "repeat-buyer", "shoes-buyer"] },

      // Inactive High Value Buyers
      { firstName: "Rohan", lastName: "Gupta", email: "rohan.gupta@example.com", phone: "+919876543214", ordersCount: 5, totalSpent: 7500, lastPurchaseDate: daysAgo(35), traits: ["high-value", "inactive-30d", "shoes-buyer"] },
      { firstName: "Neha", lastName: "Reddy", email: "neha.reddy@example.com", phone: "+919876543215", ordersCount: 7, totalSpent: 9800, lastPurchaseDate: daysAgo(42), traits: ["high-value", "inactive-30d", "jackets-buyer"] },
      { firstName: "John", lastName: "Doe", email: "john.doe@example.com", phone: "+15559876543", ordersCount: 4, totalSpent: 6200, lastPurchaseDate: daysAgo(55), traits: ["high-value", "inactive-30d", "electronics-buyer"] },
      { firstName: "Siddharth", lastName: "Mehta", email: "sid.mehta@example.com", phone: "+919876543216", ordersCount: 11, totalSpent: 16500, lastPurchaseDate: daysAgo(92), traits: ["high-value", "inactive-90d", "shoes-buyer"] },
      { firstName: "Anjali", lastName: "Desai", email: "anjali.desai@example.com", phone: "+919876543217", ordersCount: 8, totalSpent: 11000, lastPurchaseDate: daysAgo(110), traits: ["high-value", "inactive-90d", "jackets-buyer"] },

      // Active Shoppers (Normal Value)
      { firstName: "Karan", lastName: "Malhotra", email: "karan.mal@example.com", phone: "+919876543218", ordersCount: 3, totalSpent: 3200, lastPurchaseDate: daysAgo(6), traits: ["shoes-buyer", "repeat-buyer"] },
      { firstName: "Sneha", lastName: "Joshi", email: "sneha.joshi@example.com", phone: "+919876543219", ordersCount: 2, totalSpent: 2100, lastPurchaseDate: daysAgo(10), traits: ["tshirt-buyer"] },
      { firstName: "Rahul", lastName: "Nair", email: "rahul.nair@example.com", phone: "+919876543220", ordersCount: 3, totalSpent: 4500, lastPurchaseDate: daysAgo(8), traits: ["shoes-buyer", "repeat-buyer"] },
      { firstName: "Pooja", lastName: "Rao", email: "pooja.rao@example.com", phone: "+919876543221", ordersCount: 2, totalSpent: 1800, lastPurchaseDate: daysAgo(14), traits: ["tshirt-buyer"] },
      { firstName: "Alex", lastName: "Mercer", email: "alex.mercer@example.com", phone: "+15552345678", ordersCount: 3, totalSpent: 4200, lastPurchaseDate: daysAgo(1), traits: ["electronics-buyer", "repeat-buyer"] },
      
      // Inactive Shoppers (Normal Value)
      { firstName: "Aditya", lastName: "Sen", email: "aditya.sen@example.com", phone: "+919876543222", ordersCount: 2, totalSpent: 2800, lastPurchaseDate: daysAgo(38), traits: ["inactive-30d", "shoes-buyer"] },
      { firstName: "Divya", lastName: "Iyer", email: "divya.iyer@example.com", phone: "+919876543223", ordersCount: 1, totalSpent: 1200, lastPurchaseDate: daysAgo(45), traits: ["inactive-30d", "one-time-buyer", "tshirt-buyer"] },
      { firstName: "Sameer", lastName: "Kulkarni", email: "sam.kul@example.com", phone: "+919876543224", ordersCount: 2, totalSpent: 3500, lastPurchaseDate: daysAgo(75), traits: ["inactive-30d", "jackets-buyer"] },
      { firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", phone: "+15558765432", ordersCount: 1, totalSpent: 990, lastPurchaseDate: daysAgo(100), traits: ["inactive-90d", "one-time-buyer", "tshirt-buyer"] },
      { firstName: "Ravi", lastName: "Pillai", email: "ravi.p@example.com", phone: "+919876543225", ordersCount: 2, totalSpent: 2600, lastPurchaseDate: daysAgo(120), traits: ["inactive-90d", "electronics-buyer"] },

      // One-time Buyers (Active)
      { firstName: "Ishaan", lastName: "Roy", email: "ishaan.roy@example.com", phone: "+919876543226", ordersCount: 1, totalSpent: 1500, lastPurchaseDate: daysAgo(5), traits: ["one-time-buyer", "shoes-buyer"] },
      { firstName: "Kriti", lastName: "Saxena", email: "kriti.s@example.com", phone: "+919876543227", ordersCount: 1, totalSpent: 2200, lastPurchaseDate: daysAgo(11), traits: ["one-time-buyer", "jackets-buyer"] },
      { firstName: "Maya", lastName: "Lin", email: "maya.lin@example.com", phone: "+15553456789", ordersCount: 1, totalSpent: 350, lastPurchaseDate: daysAgo(15), traits: ["one-time-buyer", "tshirt-buyer"] },
      { firstName: "David", lastName: "Miller", email: "david.miller@example.com", phone: "+15554567890", ordersCount: 1, totalSpent: 4800, lastPurchaseDate: daysAgo(4), traits: ["one-time-buyer", "electronics-buyer"] },
      { firstName: "Abhishek", lastName: "Dubey", email: "abhi.d@example.com", phone: "+919876543228", ordersCount: 1, totalSpent: 1750, lastPurchaseDate: daysAgo(2), traits: ["one-time-buyer", "tshirt-buyer"] }
    ];

    // Generate remaining 25 customers programmatically to reach ~50
    const firstNames = ["Raj", "Sunita", "Tushar", "Preeti", "Gaurav", "Shweta", "Yash", "Tanvi", "Deepak", "Anupama", "Michael", "Emma", "Daniel", "Olivia", "James", "Sophia", "Robert", "Isabella", "William", "Mia", "Joseph", "Charlotte", "David", "Amelia", "Richard"];
    const lastNames = ["Joshi", "Bose", "Choudhury", "Bahl", "Kapoor", "Datta", "Vyas", "Thakur", "Pandey", "Chatterjee", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia"];
    const traitsPool = ["shoes-buyer", "jackets-buyer", "tshirt-buyer", "electronics-buyer"];
    
    for (let i = 0; i < 25; i++) {
      const orders = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const avgSpent = orders * (Math.floor(Math.random() * 2000) + 500); // 500 to 2500 per order
      const days = Math.floor(Math.random() * 150); // 0 to 150 days ago
      
      const traits = [];
      if (orders >= 3) traits.push("repeat-buyer");
      else traits.push("one-time-buyer");
      
      if (avgSpent >= 5000) traits.push("high-value");
      if (days >= 30) traits.push("inactive-30d");
      if (days >= 90) traits.push("inactive-90d");
      
      // Add product tag
      traits.push(traitsPool[i % traitsPool.length]);

      mockCustomers.push({
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}${i}@example.com`,
        phone: `+919876543${300 + i}`,
        ordersCount: orders,
        totalSpent: avgSpent,
        lastPurchaseDate: daysAgo(days),
        traits: traits
      });
    }

    await Customer.insertMany(mockCustomers);
    console.log(`Successfully seeded ${mockCustomers.length} e-commerce shoppers into the database.`);

    // Create a couple of default segments
    const activeHighValue = {
      name: "High Value Active Buyers",
      description: "Shoppers who spent > ₹5,000 and purchased recently",
      type: "manual",
      filters: { minSpent: 5000, lastPurchaseWithinDays: 30 },
      matchingCustomersCount: mockCustomers.filter(c => c.totalSpent > 5000 && (new Date() - c.lastPurchaseDate) / (1000 * 60 * 60 * 24) <= 30).length
    };

    const inactiveCustomers = {
      name: "Inactive Shoppers (>30 Days)",
      description: "Shoppers whose last purchase was over 30 days ago",
      type: "manual",
      filters: { lastPurchaseOlderThanDays: 30 },
      matchingCustomersCount: mockCustomers.filter(c => (new Date() - c.lastPurchaseDate) / (1000 * 60 * 60 * 24) > 30).length
    };

    const shoeBuyers = {
      name: "Shoe Enthusiasts",
      description: "Shoppers who purchased footwear products",
      type: "manual",
      filters: { traitsInclude: ["shoes-buyer"] },
      matchingCustomersCount: mockCustomers.filter(c => c.traits.includes("shoes-buyer")).length
    };

    await Segment.insertMany([activeHighValue, inactiveCustomers, shoeBuyers]);
    console.log("Seeded default segments.");
  } catch (err) {
    console.error("Seeding error:", err);
  }
};

module.exports = {
  connectDB
};
