import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PATHS = ['/admin', '/api/users', '/api/payload']
const ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean)

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isAdminPath(pathname)) {
    return NextResponse.next()
  }

  // If no IP allowlist configured, allow all (Cloudflare handles it)
  if (ALLOWED_IPS.length === 0) {
    return NextResponse.next()
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''

  if (ALLOWED_IPS.includes(ip)) {
    return NextResponse.next()
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export const config = {
  matcher: ['/admin/:path*', '/api/users/:path*', '/api/payload/:path*'],
}
