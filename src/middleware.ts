import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 인증이 필요한 경로 정의
  const protectedPaths = ['/dashboard', '/students', '/classes', '/sessions', '/tags', '/settings']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // 로그인/회원가입 페이지는 로그인 후 접근 불가
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // 보호된 경로에 세션 없이 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return supabaseResponse
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
