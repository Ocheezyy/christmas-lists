import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function middleware(request: NextRequest) {
  // Allow access to auth endpoints and invite pages
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/admin') ||
    request.nextUrl.pathname.startsWith('/api/share') ||
    request.nextUrl.pathname.startsWith('/invite') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/share') ||
    request.nextUrl.pathname.startsWith('/login')
  ) {
    return NextResponse.next();
  }

  // Check for authentication
  const sessionToken = request.cookies.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the JWT token (jose works in Edge Runtime)
    const { payload } = await jwtVerify(sessionToken, secret);
    
    if (!payload.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for use in the app
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.userId as string);

    return NextResponse.next({
      headers,
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};