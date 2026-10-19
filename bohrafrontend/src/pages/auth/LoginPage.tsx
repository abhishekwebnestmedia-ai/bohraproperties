import { useState, type FormEvent } from 'react';
import { useLogin } from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* ── Left — Login Form ── */}
      <div className="relative flex flex-col justify-center w-full h-full px-8 overflow-y-auto bg-white md:w-1/2 sm:px-12 lg:px-20">
        <div className="absolute top-6 left-6">
          <img src="/webnest.svg" alt="logo" className="w-16 h-auto" />
        </div>
        <div className="w-full mx-auto max-w-80">
        {/* Brand */}
        <div className="pt-10 mb-10">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-base text-gray-500">Sign in to your CRM dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 mb-6 border border-red-200 bg-red-50 rounded-xl">
            <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xs font-bold leading-none text-white">!</span>
            </div>
            <p className="text-sm text-red-700">{(error as any).message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                <Mail className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                disabled={isPending}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-400
                  focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                <Lock className="w-4.5 h-4.5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={isPending}
                className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-400
                  focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-xs font-medium text-gray-500 hover:text-gray-900">Forgot password?</a>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold
              bg-sky-500 text-white hover:bg-sky-600
              focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

          {/* Footer */}
          <p className="mt-10 text-xs text-center text-gray-400">
            © 2026 Developed by{' '}
            <a
              href="https://webnestmedia.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              WebnestMedia
            </a>
            .
          </p>
        </div>
      </div>

      {/* ── Right — Hero Image ── */}
      <div className="relative hidden w-1/2 h-full md:block">
        <img
          src="/Loginpage.png"
          alt="Webnest Properties"
          className="absolute inset-0 object-cover w-full h-full"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        {/* developer credit removed from hero area per request */}
      </div>
    </div>
  );
};

export default LoginPage;

