import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';
import { uploadImageToSupabase } from '@/lib/supabase';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { type, prompt, config, businessProfile } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Text Generation Model
    const textModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview"});
    
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
    }

    // STREAMING RESPONSE HANDLER
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const writeChunk = async (data: Record<string, unknown>) => {
       await writer.write(encoder.encode(JSON.stringify(data) + "\n"));
    };

    (async () => {
        try {
            await writeChunk({ type: "progress", message: "Starting generation process..." });

            // Task 1: Generate Text
            const textGenerationTask = async () => {
                await writeChunk({ type: "progress", message: "Generating text content..." });
                const result = await textModel.generateContent(finalPrompt);
                const response = await result.response;
                const text = response.text();
                await writeChunk({ type: "progress", message: "Text generated successfully" });
                return text;
            };

            // Task 2: Generate Image AND Upload to Supabase (Chain)
            const imageGenerationAndUploadTask = async () => {
                await writeChunk({ type: "progress", message: "Generating AI image..." });
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
                        await writeChunk({ type: "progress", message: "Using fallback image provider..." });
                        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " professional minimalist")}?width=1280&height=720&nologo=true`;
                        const fallbackResponse = await fetch(fallbackUrl);
                        const arrayBuffer = await fallbackResponse.arrayBuffer();
                        imageBuffer = Buffer.from(arrayBuffer);
                        mimeType = "image/jpeg";
                    }

                    // Upload to Supabase immediately
                    if (imageBuffer) {
                        await writeChunk({ type: "progress", message: "Uploading image to cloud..." });
                        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${mimeType.split('/')[1]}`;
                        // Return the Supabase URL
                        const url = await uploadImageToSupabase(imageBuffer, fileName, mimeType);
                        await writeChunk({ type: "progress", message: "Image upload complete" });
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
            
            await writeChunk({ type: "progress", message: "Injecting media and finalizing..." });

            let contentText = contentTextRaw;

            // Inject Image into HTML
            let imgTag = "";
            if (imageUrl) {
                if (type === 'blog') {
                    imgTag = `<img src="${imageUrl}" alt="${prompt}" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
                } else {
                    imgTag = `<img src="${imageUrl}" alt="${prompt}" style="display: block; width: 100%; max-width: 600px; height: auto; border-radius: 6px; margin: 0 auto 20px auto; border: 0;" />`;
                }
            }
            
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
        
            // Save to DB
            const contentDoc = await Content.create({
                type,
                prompt,
                config,
                content: contentText,
                imageUrl: imageUrl || undefined,
                status: 'generated'
            });

            await writeChunk({ type: "complete", data: contentDoc });

        } catch (error: unknown) {
             console.error("Pipeline Error:", error);
             const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
             await writeChunk({ type: "error", error: errorMessage });
        } finally {
            await writer.close();
        }
    })();

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });

  } catch (error: unknown) {
    console.error("Generation Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
