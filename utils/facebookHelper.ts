export async function postToFacebookPage(message: string, imageUrl?: string) {
    const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!PAGE_ID || !ACCESS_TOKEN) {
        throw new Error('Facebook API not configured');
    }

    if (!message) {
        throw new Error('Message is required');
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
        throw new Error(data.error?.message || 'Failed to post to Facebook');
    }

    return { success: true, id: data.id || data.post_id };
}
