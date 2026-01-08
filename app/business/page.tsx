"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayInput } from "@/components/ui/clay-input";
import { useToast } from "@/components/ui/clay-toast";
import { Building2, Search, Save, Loader2, RefreshCw } from "lucide-react";

interface BusinessProfile {
  url: string;
  name: string;
  description: string;
  logoUrl?: string;
  styles: {
    primaryColor: string;
    typography: string;
    borderRadius: string;
    padding: string;
  };
}

export default function BusinessProfilePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch from API instead of localStorage
    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/business");
            if (res.ok) {
                const data = await res.json();
                if (data) setProfile(data);
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };
    fetchProfile();
  }, []);

  const handleAnalyze = async () => {
    if (!url) {
      showToast("Please enter a website URL", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/business/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      const newProfile: BusinessProfile = {
        url,
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
        styles: data.styles,
      };

      setProfile(newProfile);
      showToast("Website analyzed successfully!", "success");
    } catch (error) {
        console.error(error);
      showToast("Failed to analyze website", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (profile) {
      setIsSaving(true);
      try {
        const res = await fetch("/api/business", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile),
        });
        
        if (res.ok) {
            showToast("Business profile saved to database!", "success");
        } else {
             throw new Error("Failed to save");
        }
      } catch (e) {
         showToast("Failed to save profile", "error");
      } finally {
         setIsSaving(false);
      }
    }
  };

  const updateProfile = (field: string, value: string) => {
    if (!profile) return;
    
    if (field.includes('.')) {
        const [parent, child] = field.split('.');
        setProfile({
            ...profile,
            [parent]: {
                // @ts-ignore
                ...profile[parent],
                [child]: value
            }
        });
    } else {
        setProfile({ ...profile, [field]: value });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Building2 size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Business Profile</h1>
      </div>

      <ClayCard className="space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Business Website URL</label>
            <div className="flex gap-4">
            <div className="flex-1">
                <ClayInput
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </div>
            <ClayButton onClick={handleAnalyze} disabled={loading} className="min-w-[120px]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" size={18} />}
                Analyze
            </ClayButton>
            </div>
            <p className="text-sm text-gray-500">
                We'll crawl the website to extract brand colors, typography, and other style information.
            </p>
        </div>
      </ClayCard>

      {profile && (
        <ClayCard className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-semibold text-gray-800">Brand Identity</h2>
                <ClayButton onClick={handleSave} variant="secondary" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    {isSaving ? "Saving..." : "Save Profile"}
                </ClayButton>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">General Information</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Business Name</label>
                            <ClayInput 
                                value={profile.name} 
                                onChange={(e) => updateProfile("name", e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Description</label>
                            <ClayInput 
                                value={profile.description} 
                                onChange={(e) => updateProfile("description", e.target.value)} 
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Logo URL</label>
                            <ClayInput 
                                value={profile.logoUrl || ""} 
                                onChange={(e) => updateProfile("logoUrl", e.target.value)} 
                                placeholder="https://..."
                            />
                            {profile.logoUrl && (
                                <div className="mt-2 p-2 border rounded bg-white inline-block">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={profile.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">Visual Style</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Primary Color</label>
                            <div className="flex gap-2">
                                <div 
                                    className="w-10 h-10 rounded border shadow-sm shrink-0" 
                                    style={{ backgroundColor: profile.styles.primaryColor }}
                                />
                                <ClayInput 
                                    value={profile.styles.primaryColor} 
                                    onChange={(e) => updateProfile("styles.primaryColor", e.target.value)} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Typography</label>
                            <ClayInput 
                                value={profile.styles.typography} 
                                onChange={(e) => updateProfile("styles.typography", e.target.value)} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Border Radius</label>
                                <ClayInput 
                                    value={profile.styles.borderRadius} 
                                    onChange={(e) => updateProfile("styles.borderRadius", e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-semibold">Padding</label>
                                <ClayInput 
                                    value={profile.styles.padding} 
                                    onChange={(e) => updateProfile("styles.padding", e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Preview</h4>
                <div 
                    className="border p-4 shadow-sm"
                    style={{ 
                        borderColor: profile.styles.primaryColor,
                        borderRadius: profile.styles.borderRadius,
                        padding: profile.styles.padding,
                        fontFamily: profile.styles.typography.split(',')[0]
                    }}
                >
                    <h5 className="font-bold text-lg mb-2" style={{ color: profile.styles.primaryColor }}>
                        {profile.name || "Sample Heading"}
                    </h5>
                    <p className="text-gray-600">
                        This is how your generated content might look with the applied styles. 
                        The primary color, typography, spacing, and roundness are reflected here.
                    </p>
                </div>
            </div>
        </ClayCard>
      )}
    </div>
  );
}
