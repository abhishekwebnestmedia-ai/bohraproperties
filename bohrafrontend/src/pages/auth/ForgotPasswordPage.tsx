import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../hooks/useAuth';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');

  const { mutate: forgotPassword, isPending, isSuccess, error } = useForgotPassword();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword(email);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── Left — Form ── */}
      <div className="relative flex flex-col justify-center w-full md:w-1/2 h-full px-8 sm:px-12 lg:px-20 bg-white overflow-y-auto">
        <div className="absolute top-6 left-6">
          <img src="/webnest.svg" alt="logo" className="w-16 h-auto" />
        </div>
        <div className="w-full mx-auto max-w-80">
          {/* Brand */}
          <div className="pt-10 mb-10">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Forgot password?</h1>
            <p className="mt-1.5 text-base text-gray-500">Enter your email and we'll send you a reset link</p>
          </div>

          {/* Success state */}
          {isSuccess ? (
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-8">
                A password reset link has been sent to <span className="font-medium text-gray-800">{email}</span>.
                Check your email and follow the instructions.
              </p>
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold leading-none">!</span>
                  </div>
                  <p className="text-sm text-red-700">{(error as any).message}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      disabled={isPending}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}

          <p className="mt-10 text-xs text-gray-400 text-center">
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
      <div className="hidden md:block relative w-1/2 h-full">
        <img
          src="/Loginpage.png"
          alt="Webnest Properties"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        {/* developer credit removed from hero area per request */}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
