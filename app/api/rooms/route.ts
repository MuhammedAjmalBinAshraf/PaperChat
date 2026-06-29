import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: Request) {
  try {
    let name: string | undefined;
    try {
      const body = await request.json();
      name = body.name;
    } catch {
      // Body might be empty or invalid JSON, which is acceptable
    }

    let code = '';
    let success = false;
    let dbError: unknown = null;

    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const { error } = await supabaseServer
        .from('rooms')
        .insert({
          code,
          name: name || `Room ${code}`,
          last_active: new Date().toISOString(),
        });

      if (!error) {
        success = true;
        break;
      }
      
      dbError = error;
    }

    if (!success) {
      console.error('Failed to generate unique room code after 5 attempts:', dbError);
      return NextResponse.json(
        { error: 'Could not generate room, try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error('API Error in POST /api/rooms:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
