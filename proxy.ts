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

  if(!user){
    return;
  }

  const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("profile_id", user.id)
          .single();

  

  const pathname = request.nextUrl.pathname;

  if (!user && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user && pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/sign-up")) {
    
    const role = profile?.role;

    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/user", request.url));
    }
  }

  if (
    user &&
    pathname.startsWith("/admin") &&
    profile?.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  if (
    user &&
    pathname.startsWith("/user") &&
    profile?.role !== "user"
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}
