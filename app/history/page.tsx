"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { useToast } from "@/components/ui/clay-toast";
import { FileClock, CheckCircle, XCircle, RefreshCw, Archive, Loader2, Eye, Maximize2 } from "lucide-react";

interface ContentItem {
  _id: string;
  type: 'blog' | 'email';
  prompt: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  status: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'blog' | 'email'>('all');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);

  // Regeneration Modal State
  const [rejectItem, setRejectItem] = useState<ContentItem | null>(null);
  const [feedback, setFeedback] = useState("");

  const { showToast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    try {
      let url = "/api/content?status=generated";
      if (activeTab !== 'all') url += `&type=${activeTab}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      showToast("Failed to fetch history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Content ${status === 'approved' ? 'approved' : 'archived'}`, "success");
        setItems(items.filter(i => i._id !== id));
      }
    } catch (e) {
      showToast("Operation failed", "error");
    }
  };

  const handleRegenerate = async () => {
    if (!rejectItem) return;
    setRegeneratingId(rejectItem._id);
    setRejectItem(null); // Close modal
    
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectItem._id, feedback })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Content regenerated successfully", "success");
        // Update the item in the list immediately to show new content/timestamp etc
        // Or just refetch
        fetchContent();
      } else {
        showToast("Regeneration failed", "error");
      }
    } catch (e) {
      showToast("Regeneration error", "error");
    } finally {
      setRegeneratingId(null);
      setFeedback("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <FileClock size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Generated Content</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-1">
        {(['all', 'blog', 'email'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium transition-colors ${
              activeTab === tab 
                ? "text-purple-600 border-b-2 border-purple-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
             <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-purple-500" size={32} />
             </div>
        ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
                No content found waiting for review.
            </div>
        ) : (
            items.map((item) => (
                <ClayCard key={item._id} className="p-0 overflow-hidden flex flex-col md:flex-row gap-0">
                    {/* Preview / Image Section */}
                    <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-4">
                        {item.imageUrl ? (
                             // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} className="w-full aspect-video object-cover rounded-lg shadow-sm" alt="Hero" />
                        ) : (
                            <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                No Image
                            </div>
                        )}
                        <div className="flex-1">
                             <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.type}</span>
                             <h3 className="font-bold text-gray-800 mt-1 line-clamp-2">{item.prompt}</h3>
                             <p className="text-xs text-gray-500 mt-2">
                                Generated: {new Date(item.createdAt).toLocaleDateString()}
                             </p>
                        </div>
                    </div>

                    {/* Content Preview & Actions */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                         <div className="relative border rounded-lg bg-gray-50 h-64 overflow-hidden mb-4 group">
                             <iframe 
                                srcDoc={item.content} 
                                className="w-full h-full pointer-events-none" 
                                title="preview" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none" />
                             <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setPreviewItem(item); }}
                                className="absolute bottom-2 right-2 text-xs bg-white/90 px-2 py-1 rounded shadow text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                             >
                                <Maximize2 size={12} /> Preview
                             </a>
                         </div>

                         <div className="flex justify-end gap-3">
                            {regeneratingId === item._id ? (
                                <ClayButton disabled className="gap-2">
                                    <Loader2 className="animate-spin" size={16} /> Regenerating...
                                </ClayButton>
                            ) : (
                                <>
                                    <ClayButton 
                                        variant="secondary" 
                                        className="gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                        onClick={() => setPreviewItem(item)}
                                    >
                                        <Eye size={18} /> Preview
                                    </ClayButton>
                                    <ClayButton 
                                        variant="secondary" 
                                        className="gap-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 border-red-100"
                                        onClick={() => setRejectItem(item)}
                                    >
                                        <XCircle size={18} /> Reject
                                    </ClayButton>
                                    <ClayButton 
                                        className="gap-2 bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-green-200"
                                        onClick={() => updateStatus(item._id, 'approved')}
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </ClayButton>
                                </>
                            )}
                         </div>
                    </div>
                </ClayCard>
            ))
        )}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                             previewItem.type === 'email' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                            {previewItem.type}
                        </span>
                        <h3 className="font-bold text-gray-800 line-clamp-1">{previewItem.prompt}</h3>
                    </div>
                    <button 
                        onClick={() => setPreviewItem(null)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <XCircle size={24} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="flex-1 bg-white overflow-hidden relative">
                    <iframe 
                        srcDoc={previewItem.content}
                        title="Content Preview"
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                    />
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                     <ClayButton 
                        variant="secondary" 
                        onClick={() => setPreviewItem(null)}
                     >
                        Close
                     </ClayButton>
                     {/* Allow actions directly from preview modal */}
                     <ClayButton 
                        variant="secondary" 
                        className="gap-2 text-red-500 bg-red-50 hover:bg-red-100 border-red-100"
                        onClick={() => { setPreviewItem(null); setRejectItem(previewItem); }}
                    >
                        <XCircle size={18} /> Reject
                    </ClayButton>
                    <ClayButton 
                        className="gap-2 bg-green-500 hover:bg-green-600 text-white border-green-500 shadow-green-200"
                        onClick={() => { updateStatus(previewItem._id, 'approved'); setPreviewItem(null); }}
                    >
                        <CheckCircle size={18} /> Approve
                    </ClayButton>
                </div>
            </div>
        </div>
      )}

      {/* Reject/Regenerate Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <ClayCard className="w-full max-w-lg space-y-4 p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-800">Reject Content</h3>
                <p className="text-sm text-gray-600">
                    What would you like to do with this content? You can archive it or request changes to regenerate.
                </p>
                
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter feedback for regeneration (e.g., 'Make the tone more casual' or 'Focus more on feature X')..."
                    className="w-full p-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-purple-200 min-h-[100px] text-sm"
                />

                <div className="flex gap-3 justify-end pt-2">
                    <button 
                        onClick={() => { setRejectItem(null); setFeedback(""); }}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <ClayButton 
                        variant="secondary"
                        onClick={() => {
                            updateStatus(rejectItem._id, 'archived');
                            setRejectItem(null);
                        }}
                        className="gap-2"
                    >
                        <Archive size={16} /> Archive
                    </ClayButton>
                    <ClayButton 
                        onClick={handleRegenerate}
                        disabled={!feedback.trim()}
                        className="gap-2"
                    >
                        <RefreshCw size={16} /> Regenerate
                    </ClayButton>
                </div>
            </ClayCard>
        </div>
      )}

    </div>
  );
}
