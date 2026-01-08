import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadImageToSupabase } from '@/lib/supabase';
import Content from '@/models/Content';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface GenerationOptions {
    type: 'blog' | 'email' | 'social';
    prompt: string;
    config?: any;
    businessProfile?: any;
    onProgress?: (message: string) => Promise<void>;
    existingId?: string;
}

export async function generateMarketingContent({ type, prompt, config, businessProfile, onProgress, existingId }: GenerationOptions) {
    if (!prompt) {
        throw new Error('Prompt is required');
    }

    const reportProgress = async (msg: string) => {
        if (onProgress) await onProgress(msg);
    };

    // 1. Text Generation Model
    const textModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    // 2. Image Generation Model
    const imageModel = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

    let systemInstruction = "";
    let finalPrompt = prompt;
    let imagePrompt = "";
    const placeholder = "<!-- HERO_IMAGE_PLACEHOLDER -->";

    let styleInstruction = "";
    if (businessProfile) {
        const { name, styles, logoUrl } = businessProfile;

        let logoHtml = "";
        if (logoUrl) {
            logoHtml = `
            Please include the following Logo in the HTML header or top section: 
            <img src="${logoUrl}" alt="${name} Logo" style="max-height: 50px; display: block; margin-bottom: 20px;" />
            `;
        }

        styleInstruction = `
        \nIMPORTANT BRANDING INSTRUCTIONS:
        You MUST apply the following brand styles to the HTML/CSS:
        - Primary Color: ${styles.primaryColor} (Use this for main headings, buttons, active states).
        - Font Family: ${styles.typography} (Import from Google Fonts if needed or use fallback).
        - Border Radius: ${styles.borderRadius}.
        - Spacing/Padding: ${styles.padding}.
        - Brand Tone: Match the vibe of "${name}" - ${businessProfile.description || ""}.
        
        ${logoHtml}

        Ensure these CSS variables are set in the <style> tag:
        :root {
            --primary: ${styles.primaryColor};
            --radius: ${styles.borderRadius};
            --font-main: ${styles.typography};
        }
        `;
    }

    if (type === 'blog') {
        systemInstruction = `You are an expert blog writer. Generate a complete, high-quality, SEO-optimized blog post based on the following topic. Return a full HTML document (start with <!DOCTYPE html>) with internal CSS suitable for a professional blog. The design should be modern, clean, and responsive.${styleInstruction} MUST include the comment "${placeholder}" inside the main content container at the very top, before the title. Do not wrap the output in markdown code blocks, just return the raw HTML.`;
        finalPrompt = `${systemInstruction}\n\nTopic: ${prompt}`;

        let logoPromptPart = "";
        if (businessProfile?.logoUrl) {
            // Instruct image model to leave space or try to conceptualize brand if possible
            logoPromptPart = ` Integrate the brand color ${businessProfile.styles.primaryColor} into the image palette.`;
        }
        imagePrompt = `Create a professional, high-quality hero image for a blog post about: ${prompt}. The style should be modern, clean, and engaging.${logoPromptPart}`;
    } else if (type === 'email') {
        const { tone = 'professional', purpose = 'general', audience = 'general' } = config || {};
        systemInstruction = `You are an expert email copywriter. Write an email with a ${tone} tone. The purpose is ${purpose}. The audience is ${audience}. Return a complete HTML document (start with <!DOCTYPE html>) with internal CSS. The design should look like a professional HTML email or a clean letter.${styleInstruction} MUST include the comment "${placeholder}" at the top of the email body or container. Do not wrap the output in markdown code blocks, just return the raw HTML.`;
        finalPrompt = `${systemInstruction}\n\nTopic/Details: ${prompt}`;

        let logoPromptPart = "";
        if (businessProfile?.logoUrl) {
            logoPromptPart = ` Integrate the brand color ${businessProfile.styles.primaryColor} into the image palette.`;
        }
        imagePrompt = `Create a professional, minimalist conceptual image or illustration that represents the theme of: ${prompt}. Suitable for a header or professional context.${logoPromptPart}`;
    } else if (type === 'social') {
        systemInstruction = `You are an expert social media manager. Write a captivating, high-engagement social media post caption (Facebook/Instagram/LinkedIn). Use emojis, hashtags, and a call to action. Do strictly text, no HTML.`;
        finalPrompt = `${systemInstruction}\n\nTopic/Product: ${prompt}\n\nTone: ${businessProfile?.description ? 'Match brand voice' : 'Professional yet engaging'}.`;

        let logoPromptPart = "";
        if (businessProfile?.logoUrl) {
            logoPromptPart = ` Integrate the brand color ${businessProfile.styles.primaryColor} into the image palette.`;
        }
        imagePrompt = `Create a stunning, high-engagement social media graphic for: ${prompt}. Dimensions should be square or 4:5. High contrast, scroll-stopping.${logoPromptPart}`;
    }

    // Task 1: Generate Text
    const textGenerationTask = async () => {
        await reportProgress("Generating text content...");
        const result = await textModel.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        await reportProgress("Text generated successfully");
        return text;
    };

    // Task 2: Generate Image AND Upload to Supabase (Chain)
    const imageGenerationAndUploadTask = async () => {
        await reportProgress("Generating AI image...");
        try {
            let imageBuffer: Buffer | null = null;
            let mimeType = "image/png";

            // Attempt Gemini Image Gen
            try {
                const result = await imageModel.generateContent({
                    contents: [
                        { role: 'user', parts: [{ text: imagePrompt }] }
                    ],
                    generationConfig: {
                        // @ts-ignore - imageConfig is a preview feature
                        imageConfig: {
                            aspectRatio: "16:9",
                            imageSize: "2K"
                        }
                    }
                });
                const response = await result.response;
                const parts = response.candidates?.[0]?.content?.parts || [];

                for (const p of parts) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const part = p as any;
                    if (part.inline_data || part.inlineData) {
                        const data = part.inline_data || part.inlineData;
                        mimeType = data.mime_type || data.mimeType || "image/png";
                        imageBuffer = Buffer.from(data.data, 'base64');
                        break;
                    }
                }
            } catch (imageGenError) {
                console.warn("Gemini Image Gen failed, falling back...", imageGenError);
            }

            // Fallback to Pollinations
            if (!imageBuffer) {
                await reportProgress("Using fallback image provider...");
                const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " professional minimalist")}?width=1280&height=720&nologo=true`;
                const fallbackResponse = await fetch(fallbackUrl);
                const arrayBuffer = await fallbackResponse.arrayBuffer();
                imageBuffer = Buffer.from(arrayBuffer);
                mimeType = "image/jpeg";
            }

            // Upload to Supabase immediately
            if (imageBuffer) {
                await reportProgress("Uploading image to cloud...");
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${mimeType.split('/')[1]}`;
                // Return the Supabase URL
                const url = await uploadImageToSupabase(imageBuffer, fileName, mimeType);
                await reportProgress("Image upload complete");
                return url;
            }
        } catch (e) {
            console.error("Image chain failed:", e);
        }
        return ""; // Return empty string on total failure
    };

    // Run both chains in parallel
    const [contentTextRaw, imageUrl] = await Promise.all([
        textGenerationTask(),
        imageGenerationAndUploadTask()
    ]);

    await reportProgress("Injecting media and finalizing...");

    let contentText = contentTextRaw;

    // Inject Image into HTML (Only for HTML types)
    let imgTag = "";
    if (imageUrl) {
        if (type === 'blog') {
            imgTag = `<img src="${imageUrl}" alt="${prompt}" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
        } else if (type === 'email') {
            imgTag = `<img src="${imageUrl}" alt="${prompt}" style="display: block; width: 100%; max-width: 600px; height: auto; border-radius: 6px; margin: 0 auto 20px auto; border: 0;" />`;
        }
    }

    if (type !== 'social') {
        if (contentText.includes(placeholder)) {
            // If imageUrl is empty, we just remove the placeholder
            contentText = contentText.replace(placeholder, imgTag);
        } else if (imageUrl) {
            // Fallback injection: Try to insert after opening body
            if (contentText.includes('<body')) {
                contentText = contentText.replace(/<body[^>]*>/, (match) => `${match}<div style="max-width: 800px; margin: 0 auto; padding: 20px;">${imgTag}</div>`);
            } else {
                contentText = `${imgTag}${contentText}`;
            }
        }
    } else {
        // For social, we just store the text as is. The imageUrl is stored in the doc.
    }

    // Save to DB
    let contentDoc;
    if (existingId) {
        contentDoc = await Content.findByIdAndUpdate(existingId, {
            content: contentText,
            imageUrl: imageUrl || undefined,
            status: 'generated'
        }, { new: true });
    } else {
        contentDoc = await Content.create({
            type,
            prompt,
            config,
            content: contentText,
            imageUrl: imageUrl || undefined,
            status: 'generated'
        });
    }

    return contentDoc;
}
