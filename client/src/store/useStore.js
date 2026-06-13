import { create } from "zustand";
import axios from "axios";

// Base API instance with JWT interceptor
export const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("xeno_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useStore = create((set, get) => ({
  // Navigation
  activeTab: "dashboard",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Auth State
  token: localStorage.getItem("xeno_token") || null,
  user: null,
  authLoading: false,
  authError: null,

  login: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("xeno_token", res.data.token);
      set({ token: res.data.token, user: res.data.user, authLoading: false });
      get().addToast({
        title: "Welcome Back!",
        message: `Successfully logged in as ${res.data.user.name}`,
        type: "success"
      });
      // Load initial application data
      get().fetchCustomers();
      get().fetchSegments();
      get().fetchCampaigns();
      get().fetchKpis();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password.";
      set({ authError: msg, authLoading: false });
      get().addToast({ title: "Login Failed", message: msg, type: "error" });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const res = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("xeno_token", res.data.token);
      set({ token: res.data.token, user: res.data.user, authLoading: false });
      get().addToast({
        title: "Account Created!",
        message: `Welcome to XenoAI, ${res.data.user.name}!`,
        type: "success"
      });
      // Load initial application data
      get().fetchCustomers();
      get().fetchSegments();
      get().fetchCampaigns();
      get().fetchKpis();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      set({ authError: msg, authLoading: false });
      get().addToast({ title: "Registration Failed", message: msg, type: "error" });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("xeno_token");
    set({ token: null, user: null, activeTab: "dashboard" });
    get().addToast({ title: "Logged Out", message: "Goodbye!", type: "info" });
  },

  fetchMe: async () => {
    if (!get().token) return;
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data });
    } catch (err) {
      // Token expired or invalid
      get().logout();
    }
  },

  // Customers State
  customers: [],
  customersTotal: 0,
  customersPage: 1,
  customersPages: 1,
  customersLoading: false,
  customersSearch: "",

  setCustomersSearch: (search) => set({ customersSearch: search }),
  
  fetchCustomers: async (page = 1, search = "") => {
    set({ customersLoading: true });
    try {
      const res = await api.get("/customers", {
        params: {
          page,
          search: search || get().customersSearch,
          limit: 15
        }
      });
      set({
        customers: res.data.customers,
        customersTotal: res.data.total,
        customersPage: res.data.page,
        customersPages: res.data.pages,
        customersLoading: false
      });
    } catch (err) {
      set({ customersLoading: false });
      console.error("Fetch customers error:", err);
    }
  },

  // Segments State
  segments: [],
  segmentsLoading: false,

  fetchSegments: async () => {
    set({ segmentsLoading: true });
    try {
      const res = await api.get("/segments");
      set({ segments: res.data, segmentsLoading: false });
    } catch (err) {
      set({ segmentsLoading: false });
      console.error("Fetch segments error:", err);
    }
  },

  parseAiSegment: async (prompt) => {
    try {
      const res = await api.post("/segments/ai-parse", { prompt });
      return res.data;
    } catch (err) {
      get().addToast({
        title: "AI Analysis Error",
        message: err.response?.data?.message || "Failed to parse prompt.",
        type: "error"
      });
      return null;
    }
  },

  createSegment: async (segmentData) => {
    try {
      const res = await api.post("/segments/create", segmentData);
      set((state) => ({ segments: [res.data, ...state.segments] }));
      get().addToast({
        title: "Segment Saved",
        message: `Saved "${res.data.name}" matching ${res.data.matchingCustomersCount} shoppers.`,
        type: "success"
      });
      return res.data;
    } catch (err) {
      get().addToast({
        title: "Error Saving Segment",
        message: err.response?.data?.message || "Failed to save segment.",
        type: "error"
      });
      return null;
    }
  },

  // Campaigns State
  campaigns: [],
  campaignsLoading: false,
  activeCampaignLogs: [],
  logsLoading: false,

  fetchCampaigns: async () => {
    set({ campaignsLoading: true });
    try {
      const res = await api.get("/campaigns");
      set({ campaigns: res.data, campaignsLoading: false });
    } catch (err) {
      set({ campaignsLoading: false });
      console.error("Fetch campaigns error:", err);
    }
  },

  createCampaign: async (campaignData) => {
    try {
      const res = await api.post("/campaigns/create", campaignData);
      set((state) => ({ campaigns: [res.data, ...state.campaigns] }));
      get().addToast({
        title: "Campaign Saved",
        message: `Created draft campaign "${res.data.name}".`,
        type: "success"
      });
      return res.data;
    } catch (err) {
      get().addToast({
        title: "Error Creating Campaign",
        message: err.response?.data?.message || "Failed to save campaign.",
        type: "error"
      });
      return null;
    }
  },

  sendCampaign: async (campaignId) => {
    try {
      const res = await api.post(`/campaigns/${campaignId}/send`);
      // Reload campaigns list
      get().fetchCampaigns();
      get().addToast({
        title: "Campaign Dispatched",
        message: `Sending campaign to ${res.data.recipientsCount} shoppers.`,
        type: "info"
      });
      return true;
    } catch (err) {
      get().addToast({
        title: "Send Failed",
        message: err.response?.data?.message || "Failed to send campaign.",
        type: "error"
      });
      return false;
    }
  },

  fetchCampaignLogs: async (campaignId) => {
    set({ logsLoading: true });
    try {
      const res = await api.get(`/campaigns/${campaignId}/logs`);
      set({ activeCampaignLogs: res.data, logsLoading: false });
    } catch (err) {
      set({ logsLoading: false });
      console.error("Fetch campaign logs error:", err);
    }
  },

  // Webhook and Analytics state
  kpis: null,
  webhookLogs: [],
  kpisLoading: false,
  webhooksLoading: false,

  fetchKpis: async () => {
    set({ kpisLoading: true });
    try {
      const res = await api.get("/analytics/kpis");
      set({ kpis: res.data, kpisLoading: false });
    } catch (err) {
      set({ kpisLoading: false });
      console.error("Fetch KPIs error:", err);
    }
  },

  fetchWebhookLogs: async () => {
    set({ webhooksLoading: true });
    try {
      const res = await api.get("/analytics/webhook-logs");
      set({ webhookLogs: res.data, webhooksLoading: false });
    } catch (err) {
      set({ webhooksLoading: false });
      console.error("Fetch webhook logs error:", err);
    }
  },

  // Real-time Updates Local Mutations (from Socket.IO)
  handleSocketUpdate: (update) => {
    const { campaignId, status, stats, campaignStatus, customerName } = update;
    
    // 1. Update the campaign in local state
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c._id === campaignId
          ? { ...c, status: campaignStatus, stats: stats }
          : c
      )
    }));

    // 2. Add toast alert for delivery status transitions
    if (status === "DELIVERED" || status === "FAILED" || status === "OPENED" || status === "CLICKED") {
      // Determine emoji icon based on state
      const emoji = {
        DELIVERED: "✅ Delivered",
        FAILED: "❌ Failed",
        OPENED: "👀 Opened",
        CLICKED: "🖱️ Clicked"
      }[status];

      get().addToast({
        title: `Message ${status.toLowerCase()}`,
        message: `${emoji}: Sent to ${customerName}`,
        type: status === "FAILED" ? "error" : "success"
      });
    }

    // 3. Refresh logs if the user is looking at this campaign right now
    const activeLogs = get().activeCampaignLogs;
    if (activeLogs.length > 0 && activeLogs[0].campaignId === campaignId) {
      get().fetchCampaignLogs(campaignId);
    }

    // 4. Refresh KPIs in real-time
    get().fetchKpis();
  },

  // Toast System
  toasts: [],
  addToast: ({ title, message, type = "info" }) => {
    const id = `${Date.now()}_${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }]
    }));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
