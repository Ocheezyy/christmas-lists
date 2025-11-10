import { NextResponse } from 'next/server';
import { getAuthOptions } from '@/lib/webauthn';

export async function POST() {
  try {
    // Generate authentication options (allow any registered credential)
    const options = await getAuthOptions();
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Login options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
