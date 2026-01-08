"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { useToast } from "@/components/ui/clay-toast";
import { Send, Loader2, Facebook, Twitter, Linkedin, Globe, Archive } from "lucide-react";

interface ContentItem {
  _id: string;
  type: 'blog' | 'email' | 'social';
  prompt: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export default function PublishingPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishItem, setPublishItem] = useState<ContentItem | null>(null);
  const [emailItem, setEmailItem] = useState<ContentItem | null>(null);
  const [recipientList, setRecipientList] = useState("");
  const [socialTab, setSocialTab] = useState<'twitter' | 'facebook' | 'linkedin'>('twitter');
  
  const { showToast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content?status=approved", { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      showToast("Failed to fetch publishing hub", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handlePublish = async (platform: string) => {
    if (!publishItem) return;

    if (platform === 'facebook') {
        const message = `We just published a new piece: "${publishItem.prompt}". Read more below!`;
        
        try {
            const res = await fetch("/api/social/facebook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message,
                    imageUrl: publishItem.imageUrl
                })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                showToast(`Published to Facebook successfully!`, "success");
                setPublishItem(null);
                
                await fetch("/api/content", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: publishItem._id, status: 'published' })
                });
                fetchContent();
            } else {
                showToast(`Facebook Error: ${data.error}`, "error");
            }
        } catch (e) {
            showToast("Failed to connect to Facebook API", "error");
        }
    } else {
        // Simulate other platforms for now
        showToast(`Published to ${platform} successfully! (Simulation)`, "success");
        setPublishItem(null);
        // Optionally move to 'published' status
        await fetch("/api/content", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: publishItem._id, status: 'published' })
        });
        fetchContent();
    }
  };

  const handleSendEmail = async () => {
    if (!recipientList.trim()) return;
    
    // API Call to Send Email
    try {
        setLoading(true);
        const res = await fetch("/api/email/send", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                 recipients: recipientList,
                 subject: emailItem?.prompt || "New Email Campaign",
                 content: emailItem?.content
             })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast(`Email sent successfully!`, "success");
            setEmailItem(null);
            setRecipientList("");
            
            // Mark as published
            await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: emailItem!._id, status: 'published' })
            });
            fetchContent();
        } else {
             showToast(`Failed to send: ${data.error}`, "error");
        }

    } catch (e) {
        showToast("Error sending email", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
      await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: 'archived' })
      });
      fetchContent();
      showToast("Moved to archive", "info");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Send size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Publishing Hub</h1>
      </div>

       <div className="space-y-4">
        {loading ? (
             <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-purple-500" size={32} />
             </div>
        ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <p>No approved content ready to publish.</p>
                <p className="text-sm mt-2">Approve some content in the History tab first.</p>
            </div>
        ) : (
            items.map((item) => (
                <ClayCard key={item._id} className="p-4 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                        {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} className="w-full h-full object-cover" alt="Thumb" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Globe size={24} />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.type === 'email' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                                {item.type}
                            </span>
                             <span className="text-xs text-gray-400">Approved on {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 truncate">{item.prompt}</h3>
                        <p className="text-sm text-gray-500 truncate mt-1">Ready for distribution.</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                         <ClayButton 
                            variant="secondary"
                            className="w-10 h-10 p-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleArchive(item._id)}
                            title="Archive"
                        >
                            <Archive size={18} />
                        </ClayButton>
                        
                        {item.type === 'blog' || item.type === 'social' ? (
                            <ClayButton onClick={() => setPublishItem(item)}>
                                Publish to Socials
                            </ClayButton>
                        ) : (
                            <ClayButton onClick={() => setEmailItem(item)} className="bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-blue-200">
                                <Send size={16} className="mr-2" /> Send Campaign
                            </ClayButton>
                        )}
                    </div>
                </ClayCard>
            ))
        )}
      </div>

      {/* Email Sending Modal */}
      {emailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
             <ClayCard className="w-full max-w-lg space-y-4 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800">Send Email Campaign</h3>
                <p className="text-sm text-gray-600">
                    Who should receive this email? Enter recipients below.
                </p>
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Recipients (Comma separated)</label>
                    <textarea
                        value={recipientList}
                        onChange={(e) => setRecipientList(e.target.value)}
                        placeholder="john@example.com, team@company.com..."
                        className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-purple-200 min-h-[100px] text-sm"
                    />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <button 
                        onClick={() => { setEmailItem(null); setRecipientList(""); }}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <ClayButton 
                        onClick={handleSendEmail}
                        disabled={!recipientList.trim()}
                        className="gap-2 bg-blue-600 border-blue-600 hover:bg-blue-700 shadow-blue-200"
                    >
                        <Send size={16} /> Send Now
                    </ClayButton>
                </div>
            </ClayCard>
        </div>
      )}

      {/* Social Preview Modal */}
      {publishItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
             <ClayCard className="w-full max-w-2xl bg-gray-50 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Social Media Preview</h3>
                    <button onClick={() => setPublishItem(null)} className="text-gray-400 hover:text-gray-600">
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Platform Tabs */}
                    <div className="flex gap-2 mb-6 justify-center">
                        <button 
                            onClick={() => setSocialTab('twitter')}
                            className={`p-3 rounded-full transition-all ${socialTab === 'twitter' ? 'bg-black text-white shadow-lg scale-110' : 'bg-white text-gray-400'}`}
                        >
                            <Twitter size={20} />
                        </button>
                         <button 
                            onClick={() => setSocialTab('facebook')}
                            className={`p-3 rounded-full transition-all ${socialTab === 'facebook' ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white text-gray-400'}`}
                        >
                            <Facebook size={20} />
                        </button>
                         <button 
                            onClick={() => setSocialTab('linkedin')}
                            className={`p-3 rounded-full transition-all ${socialTab === 'linkedin' ? 'bg-[#0077b5] text-white shadow-lg scale-110' : 'bg-white text-gray-400'}`}
                        >
                            <Linkedin size={20} />
                        </button>
                    </div>

                    {/* Preview Cards */}
                    <div className="max-w-md mx-auto">
                        {socialTab === 'twitter' && (
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                                    <div className="space-y-2 w-full">
                                        <div className="flex justify-between">
                                            <div>
                                                <span className="font-bold text-gray-900">Your Brand</span>
                                                <span className="text-gray-500 ml-1">@brand · Now</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-800 text-sm">
                                            Here is our latest article on {publishItem.prompt}. Check it out! #content #ai
                                        </p>
                                        {publishItem.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={publishItem.imageUrl} className="w-full rounded-xl border border-gray-100 mt-2" alt="Post" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {socialTab === 'facebook' && (
                             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="p-3 flex gap-2 items-center">
                                     <div className="w-10 h-10 rounded-full bg-gray-200" />
                                     <div>
                                         <p className="font-bold text-gray-900 text-sm">Your Brand</p>
                                         <p className="text-xs text-gray-500">Just now · <Globe size={10} className="inline" /></p>
                                     </div>
                                </div>
                                <p className="px-3 pb-3 text-sm text-gray-800">
                                     We just published a new piece: "{publishItem.prompt}". Read more below!
                                </p>
                                {publishItem.imageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={publishItem.imageUrl} className="w-full aspect-[1.91/1] object-cover" alt="Post" />
                                )}
                                <div className="bg-gray-50 p-3 border-t">
                                    <p className="text-xs uppercase text-gray-500">YOURWEBSITE.COM</p>
                                    <p className="font-bold text-gray-900 text-sm truncate">{publishItem.prompt}</p>
                                </div>
                             </div>
                        )}

                        {socialTab === 'linkedin' && (
                             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="p-3 flex gap-2 items-center">
                                     <div className="w-12 h-12 rounded-sm bg-gray-200" />
                                     <div>
                                         <p className="font-bold text-gray-900 text-sm">Your Brand</p>
                                         <p className="text-xs text-gray-500">1,234 followers</p>
                                         <p className="text-xs text-gray-500">1m · <Globe size={10} className="inline" /></p>
                                     </div>
                                </div>
                                <p className="px-3 pb-3 text-sm text-gray-800">
                                     I'm excited to share our latest insights on {publishItem.prompt}. Let me know your thoughts in the comments! 👇
                                </p>
                                {publishItem.imageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={publishItem.imageUrl} className="w-full aspect-[1.91/1] object-cover" alt="Post" />
                                )}
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-white border-t flex justify-end gap-3">
                    <ClayButton variant="secondary" onClick={() => setPublishItem(null)}>Cancel</ClayButton>
                    <ClayButton onClick={() => handlePublish(socialTab)} className="bg-blue-600 border-blue-600 hover:bg-blue-700 text-white shadow-blue-200">
                        Publish to {socialTab.charAt(0).toUpperCase() + socialTab.slice(1)}
                    </ClayButton>
                </div>
             </ClayCard>
        </div>
      )}
    </div>
  );
}
