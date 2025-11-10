import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

export async function GET(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const { proxy } = await params;
  return proxyRequest(request, proxy, 'PATCH');
}

async function proxyRequest(request: NextRequest, proxyPath: string[], method: string) {
  try {
    const path = proxyPath.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    // Add back /api prefix since Next.js route strips it
    // Route /api/[...proxy] catches /api/departments as params=['departments']
    const url = `${API_GATEWAY_URL}/api/${path}${searchParams ? `?${searchParams}` : ''}`;

    // Get body for POST/PUT/PATCH
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.text();
      } catch (e) {
        // No body
      }
    }

    // Forward headers
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      // Skip host and connection headers
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    // Forward cookies from request
    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      headers['cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }

    console.log('[API Proxy]', method, path, {
      hasCookies: cookies.length > 0,
      cookieNames: cookies.map(c => c.name)
    });

    // Make request to API Gateway
    const response = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // Get response as blob to handle any content type (including compressed)
    const responseBlob = await response.blob();

    // Create response with same status and body
    const nextResponse = new NextResponse(responseBlob, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward response headers (but exclude some that Next.js handles)
    // Also exclude content-encoding since fetch already decompressed the response
    const excludeHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'content-encoding', 'content-length'];
    response.headers.forEach((value, key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value);
      }
    });

    // Parse and set cookies using NextResponse.cookies API
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse Set-Cookie header
      const cookieMatch = setCookieHeader.match(/^([^=]+)=([^;]+);?\s*(.*)/);
      
      if (cookieMatch) {
        const [, name, value, attributes] = cookieMatch;
        const options: any = { path: '/' };
        
        // Parse cookie attributes
        if (attributes) {
          if (attributes.includes('HttpOnly')) options.httpOnly = true;
          if (attributes.includes('Secure')) options.secure = true;
          
          const maxAgeMatch = attributes.match(/Max-Age=(\d+)/i);
          if (maxAgeMatch) options.maxAge = parseInt(maxAgeMatch[1]);
          
          const sameSiteMatch = attributes.match(/SameSite=(Strict|Lax|None)/i);
          if (sameSiteMatch) options.sameSite = sameSiteMatch[1].toLowerCase();
        }
        
        // Set cookie using NextResponse.cookies.set()
        nextResponse.cookies.set(name.trim(), value.trim(), options);
        console.log('[API Proxy] Set cookie:', name.trim(), options);
      }
    }

    console.log('[API Proxy] Response', {
      status: response.status,
      hasSetCookie: !!setCookieHeader
    });

    return nextResponse;
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
