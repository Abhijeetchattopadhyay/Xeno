import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, Flame } from "lucide-react";
import { useStore } from "../store/useStore";

export default function ToastContainer() {
  const toasts = useStore((state) => state.toasts);
  const removeToast = useStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";
          const isInfo = toast.type === "info";

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-start p-4 rounded-xl glass-panel-glow border-violet-500/20 shadow-2xl relative overflow-hidden"
            >
              {/* Colored Glow Accent Indicator */}
              <div
                className={`absolute top-0 left-0 w-1.5 h-full ${
                  isSuccess
                    ? "bg-emerald-500"
                    : isError
                    ? "bg-rose-500"
                    : "bg-violet-500"
                }`}
              />

              <div className="flex gap-3 items-start pl-2">
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                {isInfo && <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}
                {!isSuccess && !isError && !isInfo && (
                  <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-100 leading-tight">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-500 hover:text-gray-300 ml-4 p-0.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
