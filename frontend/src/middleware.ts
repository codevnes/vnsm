import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// JWT payload interface
interface JwtPayload {
  exp: number;
  iat: number;
  userId: string;
  email: string;
  role: string;
}

// Check if the token is valid (not expired)
function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    
    // Check if token is expired
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
}

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if we're trying to access a protected route (dashboard)
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // Skip middleware for public assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Get the token from cookies
  const token = request.cookies.get('authToken')?.value;
  
  // If it's a dashboard route and no token is present or token is invalid, redirect to login
  if (isDashboardRoute && (!token || !isTokenValid(token))) {
    // Include the full current URL path as a redirect parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the paths that middleware should run on
export const config = {
  matcher: [
    // Apply to all dashboard routes
    '/dashboard/:path*',
  ],
}; 