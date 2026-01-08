import Link from "next/link";
import { ClayCard } from "@/components/ui/clay-card";
import { PenTool, Mail, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
          Welcome to ClayAI
        </h1>
        <p className="text-gray-500 text-lg">
          Your personal AI content generation hub. Select a tool to get started.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Link href="/blog">
          <ClayCard className="h-full hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <PenTool size={32} />
              </div>
              <div className="p-2 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className="text-gray-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Blog Generator</h2>
            <p className="text-gray-500">
              Create SEO-optimized blog posts in seconds. Just enter a topic and let AI do the writing.
            </p>
          </ClayCard>
        </Link>
        
        <Link href="/email">
          <ClayCard className="h-full hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <Mail size={32} />
              </div>
              <div className="p-2 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} className="text-gray-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Assistant</h2>
            <p className="text-gray-500">
              Draft professional emails tailored to your specific audience and purpose.
            </p>
          </ClayCard>
        </Link>
      </div>
    </div>
  );
}
