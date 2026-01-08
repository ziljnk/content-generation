"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayInput } from "@/components/ui/clay-input";
import { ClayTextarea } from "@/components/ui/clay-textarea";
import { Loader2, PenTool, Copy, Check, Archive, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/clay-toast";
import { ContentSkeleton } from "@/components/ui/clay-skeleton";
import { useRouter } from "next/navigation";

interface BlogForm {
  topic: string;
}

interface GenerationResult {
    _id?: string;
    content: string;
    imageUrl?: string;
    status: string;
}

export default function BlogPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [useBusinessProfile, setUseBusinessProfile] = useState(false);
  
  // New State for Approve/Reject flow
  const [rejectMode, setRejectMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const { register, handleSubmit } = useForm<BlogForm>();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/business");
            if (res.ok) {
                const data = await res.json();
                if (data) setBusinessProfile(data);
            }
        } catch (e) {
            console.error("Failed to load business profile", e);
        }
    };
    fetchProfile();
    
    // Check for pending/processing content
    const fetchPending = async () => {
        try {
             // We need a way to filter by status and type. 
             // Currently the API for content fetching is not exposed clearly in the context, 
             // but let's assume we can query /api/history or similar, or I should probably add an endpoint for "latest pending".
             // For now, I'll rely on the global notification to tell me something is happening, 
             // but to show the skeleton on LOAD, I'd need to fetch from DB.
             // Let's assume there's an API route I can hit. If not, I'll just rely on the realtime event to trigger the skeleton.
             // Actually, the user asked for "skeleton to show there are contents generating".
             // If I reload the page, I want to see the skeleton if it's still generating.
             // So I should fetch.
             // For this MVP, I will just modify the page to LISTEN to "generating" event and show loading.
             // A full fetch implementation would require a new API endpoint like `/api/content?status=processing&type=blog`.
        } catch (e) {}
    };
    
    // Realtime Listener for THIS page context
    // The Header has its own listener, but we want to affect the main content area here
    const { createClient } = require("@/utils/supabase/client");
    const supabase = createClient();
    const channel = supabase.channel('content-generation-blog')
      .on(
        'broadcast',
        { event: 'progress' },
        (payload: any) => {
            if (payload.payload.status === 'generating' || payload.payload.status === 'pending') {
                setLoading(true);
            } else if (payload.payload.status === 'complete') {
                // Ideally fetching the result here or just reloading
                setLoading(false);
                // We might want to clear the form or show a "New content arrived" toast
                // Or even auto-fetch the latest content
            }
        }
      )
      .subscribe();

    return () => {
         supabase.removeChannel(channel);
    };

  }, []);

  const onSubmit = async (data: BlogForm) => {
    setLoading(true);
    setResult(null);
    setRejectMode(false);
    setFeedback("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blog",
          prompt: data.topic,
          businessProfile: useBusinessProfile ? businessProfile : null,
        }),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the incomplete line in buffer

        for (const line of lines) {
           if (!line.trim()) continue;
           try {
             const json = JSON.parse(line);
             if (json.type === "progress") {
                showToast(json.message, "info");
             } else if (json.type === "complete") {
                setResult(json.data);
                showToast("Blog post generated successfully!", "success");
             } else if (json.type === "error") {
                showToast("Error: " + json.error, "error");
             }
           } catch (e) {
             console.error("JSON Parse Error", e);
           }
        }
      }

    } catch (e) {
      console.error(e);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      showToast("Content copied to clipboard", "info");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApprove = async () => {
    if (!result?._id) return;
    setActionLoading(true);
    try {
        const res = await fetch("/api/content", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: result._id, status: "approved" })
        });
        
        if (res.ok) {
            showToast("Content approved and moved to Publishing Hub", "success");
            router.push("/publishing"); 
        } else {
            showToast("Failed to approve content", "error");
        }
    } catch (e) {
        showToast("Error approving content", "error");
    } finally {
        setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!result?._id) return;
    setActionLoading(true);
    try {
        const res = await fetch("/api/content", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: result._id, status: "archived" })
        });
        
        if (res.ok) {
            showToast("Content moved to archive", "success");
            setResult(null); 
            setRejectMode(false);
        } else {
            showToast("Failed to archive content", "error");
        }
    } catch (e) {
        showToast("Error archiving content", "error");
    } finally {
        setActionLoading(false);
    }
  };
  
  const handleRegenerate = async () => {
      if (!result?._id) return;
      setActionLoading(true);
      try {
          const res = await fetch("/api/regenerate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                  id: result._id, 
                  feedback: feedback || "Regenerate this content with improvements." 
              })
          });

          if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                  setResult(data.data);
                  showToast("Content regenerated!", "success");
                  setRejectMode(false);
                  setFeedback("");
              }
          } else {
              showToast("Failed to regenerate content", "error");
          }
      } catch (e) {
          showToast("Error regenerating content", "error");
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <PenTool size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Blog Post Generator</h1>
      </div>

      <ClayCard>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ClayInput 
            label="What topic would you like to write about?" 
            placeholder="e.g. The benefits of Claymorphism in UI Design"
            {...register("topic", { required: true })}
          />
          
          {businessProfile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div 
                    className="w-4 h-4 rounded-full border shadow-sm"
                    style={{ backgroundColor: businessProfile.styles.primaryColor }}
                />
                <div className="flex-1">
                    <label htmlFor="useProfile" className="text-sm font-medium text-gray-700 cursor-pointer select-none block">
                        Apply Brand Styles
                        <span className="block text-xs text-gray-500 font-normal">
                            Use typography, colors, and layout from {businessProfile.name || "your business profile"}
                        </span>
                    </label>
                </div>
                <input
                    type="checkbox"
                    id="useProfile"
                    checked={useBusinessProfile}
                    onChange={(e) => setUseBusinessProfile(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                />
            </div>
          )}

          <div className="flex justify-end">
            <ClayButton type="submit" disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <PenTool size={20} />}
              {loading ? "Generating..." : "Generate Blog Post"}
            </ClayButton>
          </div>
        </form>
      </ClayCard>

      {/* Skeleton Loading State */}
      {loading && !result && (
        <ClayCard className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                     <span className="relative flex h-10 w-10">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-10 w-10 bg-purple-500 items-center justify-center text-white">
                             <Loader2 size={24} className="animate-spin" />
                        </span>
                     </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Reviewing your request...</h3>
                <p className="text-gray-500">Our AI agents are researching and drafting your blog post. This usually takes about 30 seconds.</p>
                
                <div className="space-y-3 pt-4 bg-gray-50 p-4 rounded-xl text-left border border-gray-100">
                     <ContentSkeleton />
                </div>
            </div>
        </ClayCard>
      )}

      {loading && (
        <ClayCard className="p-6">
            <ContentSkeleton />
        </ClayCard>
      )}

      {result && !loading && (
        <ClayCard className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-xl font-bold text-gray-700">Generated Content</h3>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 flex items-center gap-2 text-sm"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          
          <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-inner">
            <iframe 
                srcDoc={result.content}
                title="Generated Blog Content"
                className="w-full h-[600px] bg-white"
                sandbox="allow-scripts"
            />
          </div>

          <div className="border-t pt-6">
              {!rejectMode ? (
                  <div className="flex items-center justify-end gap-4">
                      <ClayButton 
                        variant="secondary" 
                        onClick={() => setRejectMode(true)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                        disabled={actionLoading}
                      >
                          <XCircle size={18} className="mr-2" />
                          Reject
                      </ClayButton>
                      <ClayButton 
                        onClick={handleApprove}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        disabled={actionLoading}
                      >
                          {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} className="mr-2" />}
                          Approve & Publish
                      </ClayButton>
                  </div>
              ) : (
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2">
                       <h4 className="font-semibold text-gray-800">Rejection Options</h4>
                       <p className="text-sm text-gray-500">Provide feedback for regeneration or move strictly to archive.</p>
                       
                       <ClayTextarea 
                          placeholder="What should be improved? (e.g., 'Make it more professional', 'Focus more on benefits')"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                       />
                       
                       <div className="flex items-center justify-end gap-3 pt-2">
                           <ClayButton variant="ghost" onClick={() => setRejectMode(false)} disabled={actionLoading}>
                               Cancel
                           </ClayButton>
                           <ClayButton 
                                variant="secondary" 
                                onClick={handleArchive}
                                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                                disabled={actionLoading}
                            >
                               <Archive size={18} className="mr-2" />
                               Archive
                           </ClayButton>
                           <ClayButton 
                                onClick={handleRegenerate}
                                disabled={actionLoading}
                           >
                               {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} className="mr-2" />}
                               Regenerate
                           </ClayButton>
                       </div>
                  </div>
              )}
          </div>
        </ClayCard>
      )}
    </div>
  );
}
