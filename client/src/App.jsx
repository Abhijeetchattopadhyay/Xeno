import React, { useEffect } from "react";
import { io } from "socket.io-client";
import { useStore } from "./store/useStore";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Segments from "./pages/Segments";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import AiChat from "./pages/AiChat";

import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/ToastContainer";

function App() {
  const token = useStore((state) => state.token);
  const activeTab = useStore((state) => state.activeTab);
  const handleSocketUpdate = useStore((state) => state.handleSocketUpdate);
  const fetchMe = useStore((state) => state.fetchMe);
  const fetchCustomers = useStore((state) => state.fetchCustomers);
  const fetchSegments = useStore((state) => state.fetchSegments);
  const fetchCampaigns = useStore((state) => state.fetchCampaigns);
  const fetchKpis = useStore((state) => state.fetchKpis);

  // 1. Fetch user info and initial database states on login
  useEffect(() => {
    if (token) {
      fetchMe();
      fetchCustomers();
      fetchSegments();
      fetchCampaigns();
      fetchKpis();
    }
  }, [token]);

  // 2. Establish Socket.io connection for real-time campaign callback updates
  useEffect(() => {
    if (!token) return;

    // Connect to Node/Express server on Port 5000
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Successfully established Socket.IO gateway connection.");
    });

    socket.on("delivery-update", (update) => {
      console.log("[SOCKET LIVE CALLBACK]", update);
      handleSocketUpdate(update);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO gateway disconnected.");
    });

    return () => {
      socket.disconnect();
    };
  }, [token, handleSocketUpdate]);

  // Render Auth screen if not authenticated
  if (!token) {
    return (
      <>
        <Auth />
        <ToastContainer />
      </>
    );
  }

  // Render Page Layout
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#030303] text-gray-100">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Pages viewport */}
      <main className="flex-1 h-full overflow-hidden flex flex-col bg-transparent">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "customers" && <Customers />}
        {activeTab === "segments" && <Segments />}
        {activeTab === "campaigns" && <Campaigns />}
        {activeTab === "analytics" && <Analytics />}
        {activeTab === "aichat" && <AiChat />}
      </main>

      {/* Global Alerts system */}
      <ToastContainer />
    </div>
  );
}

export default App;