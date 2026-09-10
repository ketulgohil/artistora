import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/my-bookings', '/quotes']
const ADMIN_PATHS = ['/admin', '/api/users', '/api/payload']
const ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean)

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth check for protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get('payload-token')?.value
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // IP-based admin access restriction
  if (isAdminPath(pathname) && ALLOWED_IPS.length > 0) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      ''
    if (!ALLOWED_IPS.includes(ip)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: [
    '/dashboard/:path*',
    '/my-bookings/:path*',
    '/quotes/:path*',
    '/admin/:path*',
    '/api/users/:path*',
    '/api/payload/:path*',
  ],
}
