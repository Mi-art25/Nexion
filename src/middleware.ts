import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('supabase-auth-token');

  if (!token && pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/auth/callback', req.url));
  }

  return NextResponse.next();
}