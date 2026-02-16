export { default } from "next-auth/middleware"

export const config = { 
<<<<<<< HEAD
  // Προστατεύει όλο το site εκτός από το login και τα εσωτερικά αρχεία του auth
=======
  // Προστατεύουμε όλες τις σελίδες εκτός από το login και τα api routes του auth
>>>>>>> ebdd2cf899a8b7b6f2a3424e8e9143d91cc8b035
  matcher: ["/((?!api/auth|login).*)"] 
}