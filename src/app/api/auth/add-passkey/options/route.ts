import { NextResponse } from 'next/server';
import { getRegOptions } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deviceName } = await req.json();
    
    // Get registration options for adding a new passkey
    const options = await getRegOptions(user.id, user.name);
    
    // Store registration data in cookies
    const cookieStore = await cookies();
    cookieStore.set('add-passkey', JSON.stringify({
      userId: user.id,
      deviceName: deviceName || null,
    }), { httpOnly: true, secure: true, maxAge: 300 }); // 5 minutes

    return NextResponse.json(options);
  } catch (error) {
    console.error('Add passkey options error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start passkey registration' },
      { status: 500 }
    );
  }
}
