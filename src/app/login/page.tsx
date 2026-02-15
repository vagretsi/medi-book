import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server';
    const usernameInput = formData.get('username') as string;
    const passwordInput = formData.get('password') as string;

    const usernames = process.env.ALLOWED_USERNAMES?.split(',') || [];
    const passwords = process.env.ALLOWED_PASSWORDS?.split(',') || [];
    const userIndex = usernames.indexOf(usernameInput);

    if (userIndex !== -1 && passwords[userIndex] === passwordInput) {
      (await cookies()).set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      });
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form action={login} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800 font-sans">MediBook Login</h1>
        <div className="space-y-4">
          <input name="username" type="text" placeholder="Username" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="password" type="password" placeholder="Κωδικός" required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Είσοδος</button>
        </div>
      </form>
    </div>
  );
}