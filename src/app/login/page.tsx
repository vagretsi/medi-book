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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form action={login} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">MediBook Login</h1>
        <input name="username" type="text" placeholder="Username" required className="w-full p-3 mb-4 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        <input name="password" type="password" placeholder="Password" required className="w-full p-3 mb-6 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Είσοδος</button>
      </form>
    </div>
  );
}