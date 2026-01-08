import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    
    if (status) {
        if (status === 'generated') {
             // Treat missing status as 'generated' for backward compatibility
             query.$or = [
                 { status: 'generated' },
                 { status: { $exists: false } },
                 { status: null }
             ];
        } else {
             query.status = status;
        }
    }
    
    if (type) query.type = type;

    const content = await Content.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
       return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updated = await Content.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
    );
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
