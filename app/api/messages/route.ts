import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const since = searchParams.get('since');
    const before = searchParams.get('before');

    if (!code || code.length !== 4) {
      return NextResponse.json({ error: 'Invalid or missing room code' }, { status: 400 });
    }

    let query = supabaseServer
      .from('messages')
      .select('*')
      .eq('room_code', code);

    if (before) {
      const { data: messages, error } = await query
        .lt('created_at', before)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.error('Error fetching older messages:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      const sortedMessages = messages ? [...messages].reverse() : [];
      return NextResponse.json({ messages: sortedMessages });
    }

    if (since) {
      query = query.gt('created_at', since);
      const { data: messages, error } = await query.order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching new messages:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      return NextResponse.json({ messages: messages || [] });
    } else {
      const { data: messages, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching initial messages:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Reverse messages to display in chronological order
      const sortedMessages = messages ? [...messages].reverse() : [];
      return NextResponse.json({ messages: sortedMessages });
    }
  } catch (error) {
    console.error('API Error in GET /api/messages:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, uid, display_name, body: messageBody, attachment_url, attachment_name } = body;

    if (!code || !uid || !display_name || !messageBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (messageBody.trim().length === 0) {
      return NextResponse.json({ error: 'Message body cannot be empty' }, { status: 400 });
    }

    if (messageBody.length > 1000) {
      return NextResponse.json({ error: 'Message body too long (max 1000 characters)' }, { status: 400 });
    }

    // Check if the room exists
    const { data: room, error: roomError } = await supabaseServer
      .from('rooms')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Insert the new message
    const { error: insertError } = await supabaseServer
      .from('messages')
      .insert({
        room_code: code,
        uid,
        display_name: display_name.trim(),
        body: messageBody.trim(),
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
      });

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Update last_active of the room
    const { error: updateError } = await supabaseServer
      .from('rooms')
      .update({ last_active: new Date().toISOString() })
      .eq('code', code);

    if (updateError) {
      console.warn('Failed to update room activity timestamp:', updateError);
      // Do not fail the request if just the last_active update fails
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API Error in POST /api/messages:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
