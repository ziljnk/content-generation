"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { useToast } from "@/components/ui/clay-toast";
import { Image as ImageIcon, Link as LinkIcon, Download, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface MediaItem {
  _id: string;
  type: 'blog' | 'email';
  prompt: string;
  imageUrl: string;
  createdAt: string;
  status: string;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success) {
        setMedia(data.data);
      } else {
        showToast("Failed to load media", "error");
      }
    } catch (error) {
      showToast("Failed to load media", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("Image URL copied to clipboard", "success");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200">
            <ImageIcon size={32} />
          </span>
          Media Library
        </h1>
        <p className="text-gray-500 text-lg ml-16">
          Browse and manage all AI-generated images from your content.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-purple-600" size={48} />
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
          <ImageIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No media found</h3>
          <p className="text-gray-400">Generate some content to populate your library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {media.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ClayCard className="overflow-hidden group h-full flex flex-col">
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${
                      item.type === 'blog' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                         onClick={() => window.open(item.imageUrl, '_blank')}
                         className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                         title="Open in new tab"
                    >
                        <ExternalLink size={20} />
                    </button>
                    <button 
                         onClick={() => copyUrl(item.imageUrl)}
                         className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                         title="Copy URL"
                    >
                        <LinkIcon size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2 flex-1" title={item.prompt}>
                    {item.prompt}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                     <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                     <span className="capitalize">{item.status}</span>
                  </div>
                </div>
              </ClayCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
