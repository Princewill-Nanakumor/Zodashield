// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    const isAuth = !!token;
    const path = request.nextUrl.pathname;

    const isAuthPage = path === "/signin";
    const isAdminPage = path.startsWith("/admin");
    const isDashboardPage = path.startsWith("/dashboard");
    const isResetPasswordPage = path.startsWith("/reset-password");

    const publicPages = [
      "/",
      "/about",
      "/contact",
      "/signup",
      "/forgot-password",
    ];

    const isPublicPage = publicPages.includes(path);

    // ✅ Allow access to public pages
    if (isPublicPage) {
      return NextResponse.next();
    }

    // ✅ Allow access to reset password pages (no auth required)
    if (isResetPasswordPage) {
      return NextResponse.next();
    }

    // ✅ Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      // Both ADMIN and AGENT go to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ Protect dashboard routes
    if (isDashboardPage && !isAuth) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // ✅ Protect admin routes by role
    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // ✅ Redirect unauthenticated users trying to access other pages
    if (!isAuth && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;

        const publicPages = [
          "/",
          "/about",
          "/contact",
          "/signup",
          "/forgot-password",
          "/signin",
        ];

        // Allow reset password pages without authentication
        if (path.startsWith("/reset-password")) {
          return true;
        }

        if (publicPages.includes(path)) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/protected/:path*",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password/:path*",
    "/",
    "/about",
    "/contact",
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
