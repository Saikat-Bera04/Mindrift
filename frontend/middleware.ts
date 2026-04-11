import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/insights(.*)',
  '/activity(.*)',
  '/reports(.*)',
  '/settings(.*)'
])

const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  if (userId && isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isProtectedRoute(req)) {
      await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
