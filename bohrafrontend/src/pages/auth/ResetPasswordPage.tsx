import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useResetPassword } from '../../hooks/useAuth';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientError, setClientError] = useState('');

  const { mutate: resetPassword, isPending, isSuccess, error } = useResetPassword();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError('');
    if (password.length < 6) {
      setClientError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }
    resetPassword({ token, password, confirmPassword });
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      {/* ── Left — Form ── */}
      <div className="relative flex flex-col justify-center w-full h-full px-8 overflow-y-auto bg-white md:w-1/2 sm:px-12 lg:px-20">
        <div className="absolute top-6 left-6">
          <img src="/webnest.svg" alt="logo" className="w-16 h-auto" />
        </div>
        <div className="w-full mx-auto max-w-80">
          {/* Brand */}
          <div className="pt-10 mb-10">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Set new password</h1>
            <p className="mt-1.5 text-base text-gray-500">Enter your new password below</p>
          </div>

          {/* Success */}
          {isSuccess && (
            <div className="mb-6 flex flex-col items-center gap-3 px-4 py-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-800">Password updated successfully!</p>
                <p className="text-xs text-green-600 mt-1">You can now sign in with your new password.</p>
              </div>
              <Link
                to="/login"
                className="mt-1 px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-xl hover:bg-sky-600 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {/* APIError */}
          {(error || clientError) && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
              <p className="text-sm text-red-700">{clientError || (error as any)?.message}</p>
            </div>
          )}

          {/* Form */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                    <Lock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 6 characters"
                    disabled={isPending}
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showNew ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center">
                    <Lock className="w-4.5 h-4.5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    disabled={isPending}
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || !token}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Updating…</>
                ) : (
                  'Update Password'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-gray-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          <p className="mt-10 text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Webnest Properties. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right — Hero Image ── */}
      <div className="hidden md:block relative w-1/2 h-full">
        <img src="/Loginpage.png" alt="Webnest Properties" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-bold leading-snug drop-shadow">Premium Real Estate Management</p>
          <p className="mt-2 text-sm text-white/75 drop-shadow">Manage your property inventory, leads &amp; team from one place.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
