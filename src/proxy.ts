import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/my-bookings', '/quotes']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('payload-token')?.value

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const proxyConfig = {
  matcher: ['/dashboard/:path*', '/my-bookings/:path*', '/quotes/:path*'],
}
