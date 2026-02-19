import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from '@/src/env';

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * HTTP Basic Auth Middleware
 *
 * Protects admin routes with username/password authentication
 * Uses browser's built-in Basic Auth dialog
 *
 * Protected routes:
 * - /admin/products/new (product form)
 * - /api/admin/products (product API)
 * - /api/admin/upload-image (image upload API)
 */

export async function middleware(request: NextRequest) {
  // Safety check: If credentials not configured, deny access
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return new NextResponse('Admin authentication not configured', {
      status: 503,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  // Get Authorization header
  const authHeader = request.headers.get('authorization');

  // If no auth header present, request authentication
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }

  // Extract and decode Base64 credentials
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Validate username
    if (username !== env.ADMIN_USERNAME) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // Validate password using timing-safe comparison
    // Note: Using plain password comparison since bcrypt doesn't work in Edge Runtime
    // For production, ensure HTTPS is enabled to protect credentials in transit
    const isPasswordValid = timingSafeEqual(password, env.ADMIN_PASSWORD);

    if (!isPasswordValid) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    // Authentication successful, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Authentication error:', error);
    return new NextResponse('Authentication failed', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
      },
    });
  }
}

// Configure which routes to protect
export const config = {
  matcher: [
    '/admin/products/new',
    '/admin/products/:path*/edit',
    '/api/admin/products',
    '/api/admin/products/:path*',
    '/api/admin/upload-image',
    '/api/admin/transform-image',
  ],
};
