import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Layers, 
  Mail, 
  MessageCircle, 
  Smartphone,
  Check,
  ChevronRight,
  Eye
} from "lucide-react";
import { useStore, api } from "../store/useStore";

export default function Campaigns() {
  const segments = useStore((state) => state.segments);
  const fetchSegments = useStore((state) => state.fetchSegments);
  const createCampaign = useStore((state) => state.createCampaign);
  const sendCampaign = useStore((state) => state.sendCampaign);
  const addToast = useStore((state) => state.addToast);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Form states
  const [campaignName, setCampaignName] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("email"); // 'email', 'whatsapp', 'sms'
  
  // AI Copywriter states
  const [goalPrompt, setGoalPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("friendly"); // 'friendly', 'professional', 'urgent', 'excited'
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculated Content
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaText, setCtaText] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleGenerateAiCopy = async () => {
    if (!selectedSegmentId || !goalPrompt.trim()) {
      addToast({
        title: "Validation Error",
        message: "Please choose an audience segment and specify a campaign goal first.",
        type: "error"
      });
      return;
    }

    const seg = segments.find(s => s._id === selectedSegmentId);
    if (!seg) return;

    setIsGenerating(true);
    try {
      const res = await api.post("/ai/generate-campaign", {
        channel: selectedChannel,
        segmentName: seg.name,
        goal: goalPrompt,
        tone: selectedTone
      });

      if (res.data) {
        setSubject(res.data.subject || "");
        setBodyText(res.data.body || "");
        setCtaText(res.data.cta || "Shop Now");
        
        // Auto-fill campaign name if empty
        if (!campaignName) {
          setCampaignName(`${seg.name} - ${selectedChannel.toUpperCase()} (${selectedTone})`);
        }

        addToast({
          title: "AI Copy Generated",
          message: "Engaging copy and CTA successfully written by AI copywriter.",
          type: "success"
        });
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: "AI Generation Failed",
        message: "Could not connect to generator. Using local fallback values.",
        type: "error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAndSend = async (dispatchImmediately = false) => {
    if (!campaignName.trim() || !selectedSegmentId || !bodyText.trim()) {
      addToast({
        title: "Incomplete Form",
        message: "Please ensure all fields are filled and copy is generated before saving.",
        type: "error"
      });
      return;
    }

    setIsSaving(true);
    try {
      const campaignData = {
        name: campaignName,
        channel: selectedChannel,
        segmentId: selectedSegmentId,
        content: {
          subject: selectedChannel === "email" ? subject : undefined,
          body: bodyText,
          cta: ctaText,
          tone: selectedTone
        }
      };

      const saved = await createCampaign(campaignData);
      if (saved && dispatchImmediately) {
        // Dispatch to simulator service
        const sent = await sendCampaign(saved._id);
        if (sent) {
          // Go back to dashboard to observe live progress
          setActiveTab("dashboard");
        }
      } else if (saved) {
        // Just saved as draft
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto h-screen max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Campaign Creator
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Compose engagement copy using AI and dispatch simulator pipelines in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Creator panel */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border-white/5">
            <h3 className="text-base font-bold text-gray-100 tracking-tight mb-4">
              1. Setup Target & Channel
            </h3>

            <div className="flex flex-col gap-4">
              {/* Campaign name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 pl-1">Campaign Reference Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Shoppers Shoes Winback Drop"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-gray-200 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Segment select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 pl-1">Select Audience Segment</label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-gray-300 focus:outline-none"
                >
                  <option value="">-- Choose Segment --</option>
                  {segments.map((seg) => (
                    <option key={seg._id} value={seg._id}>
                      {seg.name} (Matches {seg.matchingCustomersCount} shoppers)
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel Selectors */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 pl-1">Select Communication Channel</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "email", label: "Email Inbox", icon: Mail, color: "text-violet-400" },
                    { id: "whatsapp", label: "WhatsApp Chat", icon: MessageCircle, color: "text-emerald-400" },
                    { id: "sms", label: "Direct SMS", icon: Smartphone, color: "text-cyan-400" }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = selectedChannel === ch.id;

                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedChannel(ch.id)}
                        className={`py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-300 font-bold text-xs ${
                          isSelected
                            ? "bg-violet-600/10 border-violet-500/50 text-violet-300 shadow-md shadow-violet-500/5"
                            : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${ch.color}`} />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-white/5">
            <h3 className="text-base font-bold text-gray-100 tracking-tight mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-violet-400" />
              2. AI Copywriter Engine
            </h3>

            <div className="flex flex-col gap-4">
              {/* Campaign goal */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 pl-1">What is the goal of this campaign?</label>
                <input
                  type="text"
                  placeholder="e.g. Winback inactive users with a 20% discount coupon"
                  value={goalPrompt}
                  onChange={(e) => setGoalPrompt(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-gray-200 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Tone selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 pl-1">Select Tone of Voice</label>
                <div className="flex gap-2">
                  {["friendly", "excited", "professional", "urgent"].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedTone(tone)}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold capitalize transition-all duration-300 ${
                        selectedTone === tone
                          ? "bg-violet-600/20 border-violet-500/30 text-violet-300"
                          : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={isGenerating || !goalPrompt.trim() || !selectedSegmentId}
                className="w-full mt-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md shadow-violet-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? "Analyzing & Writing Copy..." : "Instruct AI Copywriter"}
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border-white/5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-100 tracking-tight mb-4 flex items-center gap-1.5">
                <Eye className="w-4.5 h-4.5 text-violet-400" />
                Live Channel Preview
              </h3>

              {/* Preview Cards */}
              <div className="flex-1 min-h-[350px] flex items-center justify-center bg-black/40 rounded-xl border border-white/5 p-6 overflow-y-auto">
                {bodyText ? (
                  selectedChannel === "email" ? (
                    // Email Preview
                    <div className="w-full max-w-md bg-[#0d0d11] rounded-xl border border-white/10 shadow-2xl overflow-hidden text-xs">
                      {/* Email Browser bar */}
                      <div className="bg-white/5 px-4 py-2.5 border-b border-white/5 flex gap-1.5 items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        <span className="text-[10px] text-gray-500 ml-4">Email Client Preview</span>
                      </div>
                      <div className="p-4 border-b border-white/5 flex flex-col gap-1.5 text-gray-400">
                        <div>
                          <span className="text-gray-500">From:</span> marketing@xenoai.com
                        </div>
                        <div>
                          <span className="text-gray-500">To:</span> {"{{customer.email}}"}
                        </div>
                        <div className="text-gray-200 font-semibold">
                          <span className="text-gray-500 font-normal">Subject:</span> {subject.replace(/\{\{firstName\}\}/g, "Shopper")}
                        </div>
                      </div>
                      <div className="p-6 text-gray-300 leading-relaxed whitespace-pre-line min-h-[120px]">
                        {bodyText.replace(/\{\{firstName\}\}/g, "Shopper")}
                      </div>
                      {ctaText && (
                        <div className="px-6 pb-6 text-center">
                          <a href="#shop" className="inline-block px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/20">
                            {ctaText}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : selectedChannel === "whatsapp" ? (
                    // WhatsApp Preview
                    <div className="w-72 bg-[#0c1317] rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-xs">
                      {/* Phone top bar */}
                      <div className="bg-[#202c33] p-3 border-b border-white/5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#515c63] flex items-center justify-center text-white font-semibold">
                          XA
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-200 leading-tight">XenoAI Store</h4>
                          <span className="text-[9px] text-[#8696a0] block mt-0.5">Online (verified account)</span>
                        </div>
                      </div>
                      {/* Chat background screen */}
                      <div className="p-4 bg-[#0b141a] bg-opacity-95 min-h-[200px] flex flex-col justify-end">
                        <div className="max-w-[85%] self-start p-3 bg-[#202c33] rounded-lg border border-white/5 text-gray-200 whitespace-pre-line leading-relaxed shadow-sm relative">
                          {bodyText.replace(/\{\{firstName\}\}/g, "Shopper")}
                          <div className="text-[9px] text-[#8696a0] text-right mt-1.5">
                            {new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>

                        {ctaText && (
                          <div className="max-w-[85%] self-start mt-1.5 p-2 bg-[#202c33] rounded-lg border border-white/5 text-center font-bold text-violet-400 hover:text-violet-300 cursor-pointer shadow-sm">
                            {ctaText}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // SMS Preview
                    <div className="w-64 bg-[#1e1e24] rounded-2xl border border-white/10 shadow-2xl p-4 text-xs">
                      <div className="text-[10px] text-gray-500 text-center mb-3">SMS Conversation (XenoAI)</div>
                      <div className="bg-[#2a2b36] p-3 rounded-2xl text-gray-200 whitespace-pre-line leading-relaxed relative">
                        {bodyText.replace(/\{\{firstName\}\}/g, "Shopper")}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1 pl-1">Delivered via SMS carrier</div>
                    </div>
                  )
                ) : (
                  <span className="text-gray-500 italic text-center">
                    Awaiting AI copywriting inputs...
                  </span>
                )}
              </div>
            </div>

            {/* Save Dispatches controllers */}
            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => handleCreateAndSend(false)}
                disabled={isSaving || !bodyText}
                className="px-4 py-2.5 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 text-xs font-semibold text-gray-400 hover:text-gray-200 disabled:opacity-50"
              >
                Save Draft Campaign
              </button>
              <button
                type="button"
                onClick={() => handleCreateAndSend(true)}
                disabled={isSaving || !bodyText}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSaving ? "Dispatching..." : "Launch Telemetry Send"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
