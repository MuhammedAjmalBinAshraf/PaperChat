/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const roomCode = formData.get('roomCode') as string | null;

    if (!file || !roomCode) {
      return NextResponse.json({ error: 'Missing file or room code' }, { status: 400 });
    }

    // Limit files to 4MB to prevent exceeding Vercel's serverless function request body limits
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${roomCode}/${timestamp}_${safeName}`;

    // Upload directly using the server-side client (which handles modern TLS easily)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseServer.storage
      .from('attachments')
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: 'half',
      } as any);

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      name: file.name,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
