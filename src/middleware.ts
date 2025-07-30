// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(request) {
    const token = request.nextauth.token;
    const isAuth = !!token;
    const path = request.nextUrl.pathname;

    const isAuthPage = path === "/signin";
    const isAdminPage = path.startsWith("/admin");
    const isDashboardPage = path.startsWith("/dashboard");
    const isResetPasswordPage = path.startsWith("/reset-password");
    const isAdminManagementPage = path.startsWith(
      "/dashboard/admin-management"
    );
    const isSubscriptionPage = path === "/subscription";
    const isBillingPage = path === "/billing";

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

    // ✅ Protect admin management routes by specific emails
    if (isAdminManagementPage && token?.role === "ADMIN" && token?.email) {
      const allowedEmails =
        process.env.SUPER_ADMIN_EMAILS?.split(",").map((email) =>
          email.trim()
        ) || [];
      if (allowedEmails.length > 0 && !allowedEmails.includes(token.email)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // ✅ Redirect unauthenticated users trying to access other pages
    if (!isAuth && !isAuthPage && !isPublicPage) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // ✅ Enhanced subscription check for ALL protected routes
    if (
      isAuth &&
      !isSubscriptionPage &&
      !isBillingPage &&
      !isAuthPage &&
      !isPublicPage &&
      !isResetPasswordPage
    ) {
      try {
        const response = await fetch(
          `${request.nextUrl.origin}/api/subscription/status`,
          {
            headers: {
              Cookie: request.headers.get("cookie") || "",
            },
          }
        );

        if (response.ok) {
          const subscriptionData = await response.json();

          // 🛡️ Block access if trial expired or subscription inactive
          if (
            subscriptionData.subscriptionStatus === "expired" ||
            subscriptionData.subscriptionStatus === "inactive"
          ) {
            return NextResponse.redirect(new URL("/subscription", request.url));
          }

          // 🛡️ Check if trial has actually ended
          if (subscriptionData.trialEndsAt) {
            const trialEndDate = new Date(subscriptionData.trialEndsAt);
            const now = new Date();

            if (
              now > trialEndDate &&
              subscriptionData.subscriptionStatus !== "active"
            ) {
              return NextResponse.redirect(
                new URL("/subscription", request.url)
              );
            }
          }

          // 🛡️ Additional security: Check if user is on trial but trial has ended
          if (
            subscriptionData.subscriptionStatus === "trial" &&
            subscriptionData.trialEndsAt
          ) {
            const trialEndDate = new Date(subscriptionData.trialEndsAt);
            const now = new Date();

            if (now > trialEndDate) {
              return NextResponse.redirect(
                new URL("/subscription", request.url)
              );
            }
          }

          // 🛡️ Block access if no valid subscription status
          if (
            !subscriptionData.subscriptionStatus ||
            !["active", "trial"].includes(subscriptionData.subscriptionStatus)
          ) {
            return NextResponse.redirect(new URL("/subscription", request.url));
          }
        } else {
          // ✅ Allow access if subscription check fails (less aggressive)
          console.error("Subscription status check failed:", response.status);
          // Don't redirect - allow access and let the app handle it
        }
      } catch (error) {
        // ✅ Allow access if subscription check throws an error (less aggressive)
        console.error(
          "Error checking subscription status in middleware:",
          error
        );
        // Don't redirect - allow access and let the app handle it
      }
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
    "/subscription",
    "/billing",
    "/",
    "/about",
    "/contact",
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
