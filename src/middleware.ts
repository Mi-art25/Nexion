import { NextResponse } from 'next/server';

export function middleware() {
  // Allow all routes to pass through
  // Auth is handled client-side by each page (they show AuthModal if needed)
  return NextResponse.next();
}

// Minimal matcher - only for optimization, not for auth blocking
export const config = {
  matcher: ['/auth/callback'],
};
