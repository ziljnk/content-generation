"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { useToast } from "@/components/ui/clay-toast";
import { Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";

interface ContentItem {
  _id: string;
  type: 'blog' | 'email';
  prompt: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { showToast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content?status=archived");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      showToast("Failed to fetch archive", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleRestore = async (id: string) => {
    try {
        await fetch("/api/content", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: 'generated' })
        });
        showToast("Restored to drafts", "success");
        setItems(items.filter(i => i._id !== id));
    } catch (e) {
        showToast("Restore failed", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-200 rounded-lg text-gray-600">
          <Archive size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Archive Space</h1>
      </div>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
             <div className="col-span-full flex justify-center p-12">
                <Loader2 className="animate-spin text-purple-500" size={32} />
             </div>
        ) : items.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
                Archive is empty.
            </div>
        ) : (
            items.map((item) => (
                <ClayCard key={item._id} className="p-4 flex flex-col gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                         {item.imageUrl ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={item.imageUrl} className="w-full h-full object-cover grayscale" alt="Thumb" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300">
                                 <Archive size={32} />
                             </div>
                         )}
                         <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                            {item.type}
                         </div>
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-700 line-clamp-2">{item.prompt}</h3>
                        <p className="text-xs text-gray-400 mt-1">Archived on {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="pt-2 border-t flex justify-end">
                        <ClayButton 
                            variant="secondary" 
                            className="w-full gap-2 text-blue-600 hover:bg-blue-50 border-blue-100"
                            onClick={() => handleRestore(item._id)}
                        >
                            <RotateCcw size={16} /> Restore to Drafts
                        </ClayButton>
                    </div>
                </ClayCard>
            ))
        )}
      </div>
    </div>
  );
}
