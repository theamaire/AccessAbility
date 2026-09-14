import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "./lib/supabase/server-client";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

   if (!user && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }


  if (user && (pathname === "/login" || pathname === "/sign-up")) {
    const role = user.user_metadata?.role;

    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/user", request.url));
    }
  }


  if (user && pathname.startsWith("/admin") && user.user_metadata?.role !== "admin") {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  if (user && pathname.startsWith("/user") && user.user_metadata?.role !== "user") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

 
  return response
}