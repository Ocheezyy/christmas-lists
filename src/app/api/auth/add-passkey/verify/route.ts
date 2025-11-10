import { NextResponse } from 'next/server';
import { verifyReg } from '@/lib/webauthn';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const addPasskeyData = cookieStore.get('add-passkey');

    if (!addPasskeyData) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    const { userId, deviceName } = JSON.parse(addPasskeyData.value);

    // Verify the user ID matches
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Verify the registration and add the new credential
    const verification = await verifyReg(
      userId,
      user.name,
      body,
      deviceName
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Clear the cookie
    cookieStore.delete('add-passkey');

    return NextResponse.json({ 
      verified: true,
      message: 'Passkey added successfully'
    });
  } catch (error) {
    console.error('Add passkey verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify passkey' },
      { status: 500 }
    );
  }
}
