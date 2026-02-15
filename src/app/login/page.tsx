import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  // Server Action για τη διαχείριση του Login
  async function login(formData: FormData) {
    'use server';
    
    const usernameInput = formData.get('username') as string;
    const passwordInput = formData.get('password') as string;

    // Παίρνουμε τις λίστες από το .env (χωρισμένες με κόμμα)
    const usernames = process.env.ALLOWED_USERNAMES?.split(',') || [];
    const passwords = process.env.ALLOWED_PASSWORDS?.split(',') || [];

    // Βρίσκουμε αν το username υπάρχει στη λίστα
    const userIndex = usernames.indexOf(usernameInput);

    // Έλεγχος: Το username πρέπει να υπάρχει ΚΑΙ το password στο ίδιο index να ταιριάζει
    if (userIndex !== -1 && passwords[userIndex] === passwordInput) {
      // Δημιουργία του Cookie συνεδρίας
      (await cookies()).set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 εβδομάδα διάρκεια
      });
      
      redirect('/');
    } else {
      // Αν τα στοιχεία είναι λάθος
      redirect('/login?error=1');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MediBook Login</h1>
          <p className="text-slate-500 text-sm mt-1">Είσοδος στο σύστημα διαχείρισης</p>
        </div>

        {/* Form */}
        <form action={login} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                name="username"
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50"
                placeholder="Εισάγετε username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Κωδικός Πρόσβασης</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                name="password"
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-slate-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
          >
            Είσοδος
          </button>
        </form>

        <footer className="mt-8 text-center text-slate-400 text-xs uppercase tracking-widest">
          Vasilis Gretsistas &copy; 2026
        </footer>
      </div>
    </div>
  );
}