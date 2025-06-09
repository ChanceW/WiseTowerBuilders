import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname === "/login" || 
                      req.nextUrl.pathname === "/register" ||
                      req.nextUrl.pathname === "/";

    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!isAuth && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true, // This ensures the middleware always runs
    },
  }
);

// Protect all routes under /dashboard and /api/protected
export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*", "/api/protected/:path*"],
}; 