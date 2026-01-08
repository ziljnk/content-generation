"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayInput } from "@/components/ui/clay-input";
import { useToast } from "@/components/ui/clay-toast";
import { Webhook, Save, RefreshCw, Copy } from "lucide-react";

interface SocialMediaConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessSecret?: string;
  clientId?: string;
  clientSecret?: string;
  pageId?: string;
}

interface SettingsProfile {
  _id?: string;
  webhookSecret?: string;
  socialMedia?: {
    twitter?: SocialMediaConfig;
    linkedin?: SocialMediaConfig;
    facebook?: SocialMediaConfig;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/business");
      if (res.ok) {
        const data = await res.json();
        setProfile(data || { socialMedia: {} });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        showToast("Settings saved successfully", "success");
        const updated = await res.json();
        setProfile(updated);
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
        console.error("Error saving settings", error);
        showToast("An error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateSocialMedia = (platform: 'twitter' | 'linkedin' | 'facebook', field: string, value: string) => {
    setProfile(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            socialMedia: {
                ...prev.socialMedia,
                [platform]: {
                    ...prev.socialMedia?.[platform],
                    [field]: value
                }
            }
        };
    });
  };

  const webhookUrl = `${origin}/api/webhooks/generate`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard", "success");
    } catch (err) {
      showToast("Failed to copy", "error");
    }
  };

  if (loading) {
    return (
        <div className="p-8 flex justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-2">Settings</h1>
            <p className="text-gray-500 text-lg">Manage integrations and credentials.</p>
        </div>
        <ClayButton onClick={handleSave} disabled={saving} className="bg-primary text-white">
            {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
        </ClayButton>
      </div>

      <ClayCard className="p-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Webhook className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Webhook Integration</h2>
        </div>
        
        <div className="space-y-6">
            <p className="text-gray-600">
                Use this webhook URL to trigger marketing content generation (Blog + Email) automatically from external services like HubSpot.
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="text-sm font-semibold text-gray-500 mb-1 block">Webhook URL</label>
                <div className="flex gap-2">
                    <code className="flex-1 bg-white p-3 rounded-lg border border-gray-200 text-sm font-mono text-gray-700 break-all">
                        {webhookUrl}
                    </code>
                    <ClayButton onClick={() => copyToClipboard(webhookUrl)} variant="secondary" className="bg-white">
                        <Copy className="w-4 h-4" />
                    </ClayButton>
                </div>
            </div>
        </div>
      </ClayCard>

      <ClayCard className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Social Media Credentials</h2>
        
        <div className="space-y-8">
            {/* Twitter */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Twitter / X</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ClayInput 
                        label="API Key" 
                        value={profile?.socialMedia?.twitter?.apiKey || ""} 
                        onChange={(e) => updateSocialMedia('twitter', 'apiKey', e.target.value)}
                        placeholder="Consumer Key"
                    />
                    <ClayInput 
                        label="API Secret" 
                        type="password"
                        value={profile?.socialMedia?.twitter?.apiSecret || ""} 
                        onChange={(e) => updateSocialMedia('twitter', 'apiSecret', e.target.value)}
                        placeholder="Consumer Secret"
                    />
                    <ClayInput 
                        label="Access Token" 
                        value={profile?.socialMedia?.twitter?.accessToken || ""} 
                        onChange={(e) => updateSocialMedia('twitter', 'accessToken', e.target.value)}
                    />
                    <ClayInput 
                        label="Access Token Secret" 
                        type="password"
                        value={profile?.socialMedia?.twitter?.accessSecret || ""} 
                        onChange={(e) => updateSocialMedia('twitter', 'accessSecret', e.target.value)}
                    />
                </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">LinkedIn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ClayInput 
                        label="Client ID" 
                        value={profile?.socialMedia?.linkedin?.clientId || ""} 
                        onChange={(e) => updateSocialMedia('linkedin', 'clientId', e.target.value)}
                    />
                    <ClayInput 
                        label="Client Secret" 
                        type="password"
                        value={profile?.socialMedia?.linkedin?.clientSecret || ""} 
                        onChange={(e) => updateSocialMedia('linkedin', 'clientSecret', e.target.value)}
                    />
                    <ClayInput 
                        label="Access Token" 
                        type="password"
                        value={profile?.socialMedia?.linkedin?.accessToken || ""} 
                        onChange={(e) => updateSocialMedia('linkedin', 'accessToken', e.target.value)}
                        className="md:col-span-2"
                    />
                </div>
            </div>

            {/* Facebook */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Facebook</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ClayInput 
                        label="Page ID" 
                        value={profile?.socialMedia?.facebook?.pageId || ""} 
                        onChange={(e) => updateSocialMedia('facebook', 'pageId', e.target.value)}
                    />
                    <ClayInput 
                        label="Access Token" 
                        type="password"
                        value={profile?.socialMedia?.facebook?.accessToken || ""} 
                        onChange={(e) => updateSocialMedia('facebook', 'accessToken', e.target.value)}
                    />
                </div>
            </div>
        </div>
      </ClayCard>
    </div>
  );
}
