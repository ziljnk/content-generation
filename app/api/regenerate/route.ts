import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { id, feedback } = await req.json();

    if (!id || !feedback) {
      return NextResponse.json({ error: 'ID and feedback are required' }, { status: 400 });
    }

    const contentDoc = await Content.findById(id);
    if (!contentDoc) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview"});

    const prompt = `
    You are an expert content editor. 
    You are given an existing HTML document and a user's modification request.
    
    Original Request/Topic: ${contentDoc.prompt}
    User Feedback for Modification: ${feedback}
    
    Current HTML Content:
    ${contentDoc.content}
    
    Task: Regenerate the HTML content to address the user's feedback. 
    - Maintain the professional styling and internal CSS.
    - Keep the document structure intact (<!DOCTYPE html> ...).
    - If there is an existing <img> tag, PRESERVE IT exactly as is in the new output.
    - Do not wrap the output in markdown code blocks, just return the raw HTML.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const newContent = response.text();

    contentDoc.content = newContent;
    contentDoc.status = 'generated'; // Reset status if it was something else, though typically it would be 'generated' or 'archived'
    await contentDoc.save();

    return NextResponse.json({ success: true, data: contentDoc });

  } catch (error) {
    console.error("Regeneration Error:", error);
    return NextResponse.json({ error: 'Failed to regenerate content' }, { status: 500 });
  }
}
