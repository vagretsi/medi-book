export { default } from "next-auth/middleware"

export const config = { 
  // Προστατεύει όλο το site εκτός από το login και τα εσωτερικά αρχεία του auth
  matcher: ["/((?!api/auth|login).*)"] 
}