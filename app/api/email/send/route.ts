import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, content } = await req.json();

    if (!recipients || !content) {
      return NextResponse.json({ error: 'Recipients and content are required' }, { status: 400 });
    }

    const recipientList = recipients.split(',').map((r: string) => r.trim());

    // 1. Setup OAuth2 Client
    const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
    const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
    const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
    const USER_EMAIL = process.env.GMAIL_USER_EMAIL;

    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !USER_EMAIL) {
        // Fallback or Error if not configured
        // useful for development if keys are missing
        console.warn("Gmail API keys missing in env");
        return NextResponse.json({ error: 'Gmail API not configured on server' }, { status: 503 });
    }

    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    // 2. Get Access Token
    const { token } = await oAuth2Client.getAccessToken();
    if (!token) {
        return NextResponse.json({ error: 'Failed to generate access token' }, { status: 500 });
    }

    // 3. Create Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: token,
      },
    });

    // 4. Send Email
    // Note: In real app, might want to send individually or use BCC
    const info = await transporter.sendMail({
      from: `ClayAI Content Hub <${USER_EMAIL}>`,
      to: recipientList, // sends to all in TO field (visible to all) - for campaigns usually prefer BCC or individual sends
      subject: subject || "New Content from ClayAI",
      html: content,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error("Email/Send Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
