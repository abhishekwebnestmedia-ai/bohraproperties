import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import authService from "../../services/authService";
import type { User } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../utils/toast";

interface EditUserModalProps {
  user: User & { permissions?: Record<string, boolean> };
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  phoneNumber: string;
  designation: string;
  employeeId: string;
  teamleadName: string;
  domain: string;
}

interface PasswordState {
  newPassword: string;
  confirmPassword: string;
}

const FIELD_CONFIG: {
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: string;
  readonly?: boolean;
}[] = [
  { key: "name", label: "Full Name", placeholder: "e.g. John Doe" },
  { key: "email", label: "Email Address", placeholder: "e.g. john@company.com", type: "email" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "e.g. 9876543210", type: "tel" },
  { key: "designation", label: "Designation", placeholder: "e.g. Senior Executive" },
  { key: "employeeId", label: "Employee ID", placeholder: "e.g. EMP001" },
  { key: "teamleadName", label: "Reporting Manager", placeholder: "e.g. Rahul Sharma" },
  { key: "domain", label: "Domain", placeholder: "e.g. property / finance" },
];

const EditUserModal = ({ user, isOpen, onClose }: EditUserModalProps) => {
  const queryClient = useQueryClient();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { role: viewerRole } = useAuth();
  const canChangePassword =
    viewerRole === 'SUPERADMIN' || viewerRole === 'ADMIN' ||
    viewerRole === 'superadmin' || viewerRole === 'admin';

  const [form, setForm] = useState<FormState>({
    name: user.name ?? "",
    email: user.email ?? "",
    phoneNumber: user.phoneNumber ?? "",
    designation: user.designation ?? "",
    employeeId: user.employeeId ?? "",
    teamleadName: user.teamleadName ?? "",
    domain: user.domain ?? "",
  });

  const [pwForm, setPwForm] = useState<PasswordState>({ newPassword: '', confirmPassword: '' });
  const [showPwSection, setShowPwSection] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync form when a new user is passed in
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        designation: user.designation ?? "",
        employeeId: user.employeeId ?? "",
        teamleadName: user.teamleadName ?? "",
        domain: user.domain ?? "",
      });
      setPwForm({ newPassword: '', confirmPassword: '' });
      setShowPwSection(false);
      setPwVisible(false);
      setSuccessMsg(null);
      setErrorMsg(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen, user]);

  const mutation = useMutation({
    mutationFn: (fields: Partial<FormState & { password?: string }>) =>
      authService.updateUser(user._id, fields),
    onSuccess: (res) => {
      setSuccessMsg(res?.message ?? "Profile updated successfully.");
      setErrorMsg(null);
      toast.success('Profile Updated', `${user.name}'s profile has been saved.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userDashboard", user._id] });
      setTimeout(onClose, 1200);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to update. Please try again.";
      setErrorMsg(msg);
      toast.error('Update Failed', msg);
    },
  });

  const handleChange = (key: keyof FormState, value: string) => {
    const sanitized = key === 'phoneNumber' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [key]: sanitized }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    // Validate password if user filled it
    if (showPwSection && pwForm.newPassword) {
      if (pwForm.newPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      mutation.mutate({ ...form, password: pwForm.newPassword });
    } else {
      mutation.mutate(form);
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit user profile"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-blue-600">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">
                {user.role}
                {user.domain ? ` · ${user.domain}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              {FIELD_CONFIG.map((field, idx) => (
                <div key={field.key} className={field.key === "name" ? "sm:col-span-2" : ""}>
                  <label
                    htmlFor={`edit-${field.key}`}
                    className="block text-xs font-medium text-gray-600 mb-1.5"
                  >
                    {field.label}
                    {field.key === "name" && (
                      <span className="ml-0.5 text-red-500">*</span>
                    )}
                  </label>
                  <input
                    ref={idx === 0 ? firstInputRef : undefined}
                    id={`edit-${field.key}`}
                    type={field.type ?? "text"}
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={mutation.isPending}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400
                      focus:outline-none focus:ring-0 focus:border-blue-400
                      disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Read-only role row */}
            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs text-gray-500">
                Role <strong className="text-gray-700 capitalize">{user.role}</strong> cannot be changed here.
              </span>
            </div>

            {/* Password Change Section — Admin/Superadmin only */}
            {canChangePassword && (
              <div className="mt-5 border border-dashed border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setShowPwSection((v) => !v); setPwForm({ newPassword: '', confirmPassword: '' }); setErrorMsg(null); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 7a4 4 0 11-8 0v4H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-2V7z"
                      />
                    </svg>
                    Change Password
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showPwSection ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPwSection && (
                  <div className="px-4 pb-4 pt-1 space-y-3 bg-amber-50/40">
                    <p className="text-[11px] text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                      Setting a new password for <strong>{user.name}</strong>. Leave blank to keep current password.
                    </p>
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
                      <input
                        type={pwVisible ? 'text' : 'password'}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Min. 6 characters"
                        disabled={mutation.isPending}
                        className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setPwVisible((v) => !v)}
                        className="absolute right-2.5 top-8 text-gray-400 hover:text-gray-600"
                      >
                        {pwVisible ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password</label>
                      <input
                        type={pwVisible ? 'text' : 'password'}
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        disabled={mutation.isPending}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
            {/* Feedback messages */}
            {successMsg && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
