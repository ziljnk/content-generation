import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function GET() {
  try {
    await dbConnect();
    const mediaItems = await Content.find({ 
        imageUrl: { $exists: true, $ne: "" } 
    })
    .select('imageUrl prompt type createdAt status')
    .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: mediaItems });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
