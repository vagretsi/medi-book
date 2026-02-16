export { default } from "next-auth/middleware"

export const config = { 
  // Προστατεύουμε όλες τις σελίδες εκτός από το login και τα api routes του auth
  matcher: ["/((?!api/auth|login).*)"] 
}