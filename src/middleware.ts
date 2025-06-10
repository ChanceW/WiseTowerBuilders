import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// List of paths that should be accessible without authentication
const publicPaths = [
  "/login",
  "/register",
  "/api/auth",
  "/api/register",
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    console.log("Middleware - Processing request:", pathname);

    // Allow all public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
      console.log("Middleware - Allowing public path:", pathname);
      return NextResponse.next();
    }

    // Check if the request is for an API route
    if (pathname.startsWith("/api/")) {
      const token = await getToken({ req: request });
      console.log("Middleware - API route, token exists:", !!token);
      
      if (!token) {
        console.log("Middleware - API route unauthorized");
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { 
            status: 401, 
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            } 
          }
        );
      }
      return NextResponse.next();
    }

    // For non-API routes, only protect the dashboard
    if (pathname.startsWith("/dashboard")) {
      const token = await getToken({ req: request });
      console.log("Middleware - Dashboard route, token exists:", !!token);

      if (!token) {
        console.log("Middleware - Redirecting to login");
        const url = new URL("/login", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware - Error:", error);
    // In case of error, allow the request to proceed
    return NextResponse.next();
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 