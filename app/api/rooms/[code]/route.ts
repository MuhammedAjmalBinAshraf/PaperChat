import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;

    if (!code || code.length !== 4) {
      return NextResponse.json({ error: 'invalid code' }, { status: 400 });
    }

    const { data: room, error } = await supabaseServer
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error(`Database error fetching room ${code}:`, error);
      return NextResponse.json({ error: 'database error' }, { status: 500 });
    }

    if (!room) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('API Error in GET /api/rooms/[code]:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
