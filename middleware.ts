export { default } from "next-auth/middleware"

// Protect the /compare page and other internal routes, but allow access to the homepage
export const config = { 
  matcher: [
    "/compare/:path*",
    "/api/gdrive/:path*"
  ] 
}
