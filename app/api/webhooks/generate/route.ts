import { generateMarketingContent } from '@/lib/generation-service';
import dbConnect from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';
import BusinessProfile from '@/models/BusinessProfile';
import Content from '@/models/Content';
import { postToFacebookPage } from '@/utils/facebookHelper';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    await dbConnect();

    // Use the most recent business profile
    const profile = await BusinessProfile.findOne().sort({ updatedAt: -1 });

    if (!profile) {
        return NextResponse.json({ error: 'No business profile found. Please configure one in Settings.' }, { status: 404 });
    }

    try {
        const body = await req.json();
        const { productName, product, description, name, title, ...otherProps } = body;

        // Construct a prompt from the payload
        const productInfo = productName || product || name || title || "New Product";
        const productDesc = description || otherProps.summary || JSON.stringify(otherProps);
        
        const marketingPrompt = `Product Launch: ${productInfo}. Description: ${productDesc}`;

        // 1. Create Placeholder Records
        const blogPlaceHolder = await Content.create({
            type: 'blog',
            status: 'processing',
            prompt: marketingPrompt,
            content: 'Generating content...',
        });

        const emailPlaceHolder = await Content.create({
            type: 'email',
            status: 'processing',
            prompt: marketingPrompt,
            config: {
                tone: 'exciting',
                purpose: 'product announcement',
                audience: 'customers'
            },
            content: 'Generating content...',
        });

        const socialPlaceHolder = await Content.create({
            type: 'social',
            status: 'processing',
            prompt: marketingPrompt,
            content: 'Generating content...',
        });

        const sendProgress = async (step: string, message: string, status: "pending" | "generating" | "complete" | "error" = "generating") => {
            // Broadcast event to 'content-generation' channel
            try {
                await supabase.channel('content-generation').send({
                    type: 'broadcast',
                    event: 'progress',
                    payload: {
                        step,
                        message,
                        status,
                        timestamp: Date.now()
                    }
                });
            } catch (e) { console.error("Realtime error", e); }
        };

        // Notify start
        // We do WAIT for this brief signal so the UI knows immediately before we return
        await sendProgress("Webhook Received", `Queued generation for ${productInfo}...`, "pending");

        // 2. Start Generation in Background (Do NOT await)
        (async () => {
            try {
                 // Generate Blog Post
                const blogTask = generateMarketingContent({
                    type: 'blog',
                    prompt: marketingPrompt,
                    businessProfile: profile,
                    existingId: blogPlaceHolder._id,
                    onProgress: async (msg) => {
                        await sendProgress("Blog Generation", msg, "generating");
                    }
                });

                // Generate Email
                const emailTask = generateMarketingContent({
                    type: 'email',
                    prompt: marketingPrompt,
                    config: {
                        tone: 'exciting',
                        purpose: 'product announcement',
                        audience: 'customers'
                    },
                    businessProfile: profile,
                    existingId: emailPlaceHolder._id,
                    onProgress: async (msg) => {
                        await sendProgress("Email Generation", msg, "generating");
                    }
                });

                // Generate Social & Publish
                const socialTask = (async () => {
                     const doc = await generateMarketingContent({
                        type: 'social',
                        prompt: marketingPrompt,
                        businessProfile: profile,
                        existingId: socialPlaceHolder._id,
                        onProgress: async (msg) => {
                             await sendProgress("Social Post Generation", msg, "generating");
                        }
                     });
                     
                     if (doc && doc.content) {
                         await sendProgress("Social Publishing", "Publishing to Facebook...", "generating");
                         try {
                            await postToFacebookPage(doc.content, doc.imageUrl);
                            
                            // Mark as published
                            doc.status = 'published';
                            await doc.save();
                            
                            await sendProgress("Social Publishing", "Published to Facebook successfully!", "complete");
                         } catch (fbError: any) {
                             console.error("Auto-Publish Error", fbError);
                             await sendProgress("Social Publishing", `Failed to publish: ${fbError.message}`, "error");
                         }
                     }
                })();

                await Promise.all([blogTask, emailTask, socialTask]);
                await sendProgress("Complete", `Successfully generated content for ${productInfo}`, "complete");
            } catch (bgError: any) {
                console.error("Background Generation Error", bgError);
                await sendProgress("Error", bgError.message || "Generation failed", "error");
                
                // Update records to error state if needed (optional, assuming we might look at them later)
                // For simplicity, we leave them or could mark them archived/error if we added that status
            }
        })();

        // 3. Return Immediate Response
        return NextResponse.json({
            success: true,
            message: 'Content generation queued.',
            data: {
                blogId: blogPlaceHolder._id,
                emailId: emailPlaceHolder._id,
                socialId: socialPlaceHolder._id
            }
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
