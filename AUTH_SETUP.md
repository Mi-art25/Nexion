# Nexion Authentication Setup Guide

## Overview

Nexion uses Supabase for OAuth authentication with Google as the primary provider. This document outlines the setup requirements and fixes for the "No auth code found in the callback URL" error.

## Error: "No auth code found in the callback URL"

### What Causes This?

1. **Incorrect Redirect URI** - OAuth provider isn't configured with the callback URL
2. **Cookie Issues** - Browser cookies are disabled or blocked
3. **PKCE Flow Missing** - OAuth code exchange flow not properly set up
4. **Environment Variables** - Missing or incorrect Supabase credentials

### Solutions

#### 1. Configure Supabase OAuth Settings

Go to your Supabase project dashboard:

1. **Navigate to:** Authentication → Providers → Google
2. **Add your OAuth Credentials:**
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)

3. **Set Redirect URI:**

   ```
   http://localhost:3000/auth/callback    (for local development)
   https://yourdomain.com/auth/callback   (for production)
   ```

4. **Also configure in Google Cloud Console:**
   - Go to APIs & Services → Credentials
   - Click the OAuth 2.0 Client ID
   - Under "Authorized redirect URIs" add:
     ```
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback
     ```

#### 2. Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# App URL (for OAuth callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000    (development)
# or
NEXT_PUBLIC_APP_URL=https://yourdomain.com   (production)
```

#### 3. Ensure Cookies are Enabled

For OAuth to work properly:

- Cookies must be enabled in your browser
- Third-party cookies should be allowed for Supabase domain
- Incognito/Private mode might block cookies - use regular browsing mode

#### 4. Clear Browser Cache

If you've made changes to OAuth settings:

1. Clear all cookies for your domain
2. Clear browser cache
3. Close and reopen browser
4. Try signing in again

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ User clicks "Sign in with Google"                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ AuthModal.jsx calls supabase.auth.signInWithOAuth()   │
│ Redirects to: Google OAuth provider                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ User authenticates with Google                         │
│ Google redirects back to: /auth/callback?code=...      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ AuthCallbackPage receives code parameter               │
│ Calls: supabase.auth.exchangeCodeForSession(code)      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ Session created, cookie stored                         │
│ Redirects to: /chat (or specified next URL)            │
└─────────────────────────────────────────────────────────┘
```

## Debugging Steps

### 1. Check Browser Console

When you get the error, open DevTools (F12) → Console and look for:

- Network requests to Google OAuth endpoints
- Errors from Supabase client
- Redirect URL in the address bar

### 2. Verify Supabase Configuration

```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 3. Test PKCE Flow

The callback should have:

```
https://yourdomain.com/auth/callback?code=...&code_challenge=...
```

If the code is missing, check:

- OAuth provider configuration
- Redirect URI is exactly matching
- Cookies are enabled

### 4. Check Browser Developer Tools

1. Go to DevTools → Application → Cookies
2. Look for `sb-` prefixed cookies for your Supabase domain
3. If missing, the PKCE flow didn't complete

## Error Page Handling

When authentication fails, users see:

- **no_code**: No authorization code received
- **access_denied**: User denied permissions
- **exchange_failed**: Session exchange failed
- **invalid_request**: Invalid authentication request
- **server_error**: Authentication server error

Each error includes:

- Clear explanation of what went wrong
- Troubleshooting steps
- Links to try again or contact support
- Auto-redirect to home page after 5 seconds

## Testing Authentication Locally

1. **Start development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to home page and click sign in**

3. **If you get the error:**
   - Check `.env.local` is properly set
   - Verify Supabase OAuth settings
   - Clear cookies and try in incognito mode
   - Check browser console for specific errors

4. **Successful flow:**
   - You'll be redirected to Google
   - After authenticating, you'll go to `/auth/callback`
   - Then automatically redirect to `/chat`
   - `sb-access-token` cookie will be set

## Production Deployment

When deploying to production:

1. **Update `.env` variables:**

   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_SUPABASE_URL=prod_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key
   ```

2. **Update Supabase OAuth settings:**
   - Add production URL to redirect URIs
   - Update Google OAuth credentials

3. **Enable HTTPS:**
   - OAuth requires HTTPS in production
   - Ensure your domain has valid SSL certificate

4. **Test flow:**
   - Verify cookies work on production domain
   - Test OAuth flow end-to-end
   - Monitor error logs for issues

## Support

If authentication continues to fail:

1. Check all environment variables are set
2. Verify OAuth credentials in Supabase and Google Cloud
3. Ensure redirect URIs match exactly (including protocol and domain)
4. Clear all cookies and cache
5. Try in a different browser or incognito mode
6. Contact support@nexion.app with detailed error information

---

Last Updated: May 18, 2026
