import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, imageUrl } = await req.json();

    const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!PAGE_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Facebook API not configured' }, { status: 503 });
    }

    if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let url = '';
    let body = {};

    if (imageUrl) {
        // Post a photo
        url = `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`;
        body = {
            url: imageUrl,
            caption: message,
            access_token: ACCESS_TOKEN,
            published: true
        };
    } else {
        // Post text update
        url = `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`;
        body = {
            message: message,
            access_token: ACCESS_TOKEN,
            published: true
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Facebook API Error:", data);
        return NextResponse.json({ error: data.error?.message || 'Failed to post to Facebook' }, { status: response.status });
    }

    return NextResponse.json({ success: true, id: data.id || data.post_id });

  } catch (error: any) {
    console.error("Facebook Route Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
