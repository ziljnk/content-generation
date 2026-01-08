"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, CheckCircle2, CircleDashed, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ProgressEvent {
  step: string;
  message: string;
  status: "pending" | "generating" | "complete" | "error";
  timestamp: number;
}

export function Header() {
  const [notifications, setNotifications] = useState<ProgressEvent[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel('content-generation')
      .on(
        'broadcast',
        { event: 'progress' },
        (payload) => {
          console.log('Received payload:', payload);
          const event: ProgressEvent = payload.payload;
          
          setCurrentProgress(event.message);
          
          if (event.status === 'complete' || event.status === 'error') {
             // Keep the completion message for a bit, then clear current progress
             setTimeout(() => setCurrentProgress(null), 5000);
          }

          setNotifications((prev) => [event, ...prev].slice(0, 50));
          
          // Auto-open panel on start if not already open (optional, maybe just show a toast-like bubble)
          if (event.status === 'generating') {
             // Optionally auto-expand or just show the floating progress
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const togglePanel = () => setIsPanelOpen(!isPanelOpen);

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex-1">
         {/* Breadcrumbs or Title could go here */}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Floating Progress Indicator (Active) */}
        <AnimatePresence>
            {currentProgress && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-purple-100 mr-2"
                >
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="text-sm font-medium text-purple-700">{currentProgress}</span>
                </motion.div>
            )}
        </AnimatePresence>

        <button 
            onClick={togglePanel}
            className="relative p-2 rounded-full hover:bg-white transition-colors text-gray-600 hover:text-purple-600"
        >
            <Bell size={20} />
            {currentProgress && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
        </button>

        {/* Notification Panel */}
        <AnimatePresence>
            {isPanelOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-semibold text-sm text-gray-700">Notifications</h3>
                        <button onClick={togglePanel} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((n, i) => (
                                    <div key={i} className="p-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                                        <div className="mt-1">
                                            {n.status === 'generating' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                            {n.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            {n.status === 'error' && <X className="w-4 h-4 text-red-500" />}
                                            {n.status === 'pending' && <CircleDashed className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 font-medium truncate">{n.step}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(n.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </header>
  );
}
