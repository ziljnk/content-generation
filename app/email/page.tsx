"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayInput } from "@/components/ui/clay-input";
import { ClayTextarea } from "@/components/ui/clay-textarea";
import { Loader2, Mail, Copy, Check, Send, Archive, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/clay-toast";
import { ContentSkeleton } from "@/components/ui/clay-skeleton";
import { useRouter } from "next/navigation";

interface EmailForm {
  topic: string;
  tone: string;
  purpose: string;
  audience: string;
}

interface GenerationResult {
    _id?: string;
    content: string;
    imageUrl?: string;
    status: string;
}

export default function EmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [useBusinessProfile, setUseBusinessProfile] = useState(false);
  
  // New State
  const [rejectMode, setRejectMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const { register, handleSubmit } = useForm<EmailForm>({
    defaultValues: {
      tone: "professional",
      purpose: "general",
      audience: "colleague"
    }
  });
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
  }, []);

  const onSubmit = async (data: EmailForm) => {
    setLoading(true);
    setResult(null);
    setRejectMode(false);
    setFeedback("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          prompt: data.topic,
          businessProfile: useBusinessProfile ? businessProfile : null,
          config: {
            tone: data.tone,
            purpose: data.purpose,
            audience: data.audience
          }
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
                showToast("Email draft generated successfully!", "success");
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
      showToast("Draft copied to clipboard", "info");
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
            showToast("Draft approved and moved to Publishing Hub", "success");
            router.push("/publishing"); 
        } else {
            showToast("Failed to approve draft", "error");
        }
    } catch (e) {
        showToast("Error approving draft", "error");
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
            showToast("Draft moved to archive", "success");
            setResult(null); 
            setRejectMode(false);
        } else {
            showToast("Failed to archive draft", "error");
        }
    } catch (e) {
        showToast("Error archiving draft", "error");
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
                  showToast("Draft regenerated!", "success");
                  setRejectMode(false);
                  setFeedback("");
              }
          } else {
              showToast("Failed to regenerate draft", "error");
          }
      } catch (e) {
          showToast("Error regenerating draft", "error");
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Mail size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Email Assistant</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
             {/* Configuration Panel */}
            <ClayCard className="space-y-4 h-full">
                <h3 className="font-bold text-gray-700 mb-2">Configuration</h3>
                
                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-gray-600">Tone</label>
                    <select 
                        {...register("tone")}
                        className="clay-input appearance-none cursor-pointer bg-white"
                    >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="urgent">Urgent</option>
                        <option value="persuasive">Persuasive</option>
                        <option value="apologetic">Apologetic</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-gray-600">Purpose</label>
                    <select 
                        {...register("purpose")}
                        className="clay-input appearance-none cursor-pointer bg-white"
                    >
                        <option value="general">General Update</option>
                        <option value="sales">Sales / Pitch</option>
                        <option value="followup">Follow-up</option>
                        <option value="request">Request Info</option>
                        <option value="invitation">Invitation</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1 text-gray-600">Audience</label>
                    <ClayInput 
                        placeholder="e.g. Client, Boss..." 
                        {...register("audience")}
                    />
                </div>
            </ClayCard>
        </div>

        <div className="md:col-span-2 space-y-6">
            <ClayCard>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <ClayTextarea 
                        label="What is this email about?" 
                        placeholder="e.g. Asking for a meeting to discuss the Q3 marketing strategy..."
                        className="min-h-[150px]"
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
                                        Match {businessProfile.name}
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
                        <ClayButton variant="secondary" type="submit" disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {loading ? "Drafting..." : "Generate Email"}
                        </ClayButton>
                    </div>
                </form>
            </ClayCard>
            {loading && (
                <ClayCard className="p-6">
                    <ContentSkeleton />
                </ClayCard>
            )}

            {result && !loading && (
                <ClayCard className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/80 overflow-hidden">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="text-xl font-bold text-gray-700">Draft</h3>
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
                            title="Generated Email Content"
                            className="w-full h-[500px] bg-white"
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
                                    placeholder="What should be improved?"
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
      </div>
    </div>
  );
}
