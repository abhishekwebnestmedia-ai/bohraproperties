import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import TextInput from '../common/TextInput';
import CustomSelect from '../common/CustomSelect';
import { authService } from '../../services/authService';
import { getCurrentUser } from '../../utils/auth';
import { useUsers } from '../../hooks/useUsers';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  /** Values collected in step 1 */
  domain?: string;
  designation?: string;
};

interface FormState {
  name: string;
  phone: string;
  email: string;
  employeeId: string;
  password: string;
  confirmPassword: string;
  address: string;
  aadhar: string;
  teamleadName: string;
}

const INITIAL_FORM: FormState = {
  name: '', phone: '', email: '', employeeId: '',
  password: '', confirmPassword: '', address: '',
  aadhar: '', teamleadName: '',
};

const MemberDetailsModal: React.FC<Props> = ({
  isOpen, onClose, onBack, domain = 'property', designation = 'employee',
}) => {
  const currentUser = getCurrentUser();
  const isTeamLeadCreator = currentUser.role === 'TEAMLEAD';
  const { data: usersData } = useUsers();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [documents, setDocuments]   = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const profileInputRef = useRef<HTMLInputElement>(null);
  const docsInputRef    = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ── profile picture ── */
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setProfilePreview(null);
    if (profileInputRef.current) profileInputRef.current.value = '';
  };

  /* ── documents ── */
  const handleDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments((prev) => [...prev, ...files]);
  };

  const removeDoc = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const domainTeamLeads = (usersData?.users || []).filter(
    (u) =>
      u.role?.toLowerCase() === 'teamlead' &&
      (u.domain || '').toLowerCase() === String(domain || '').toLowerCase() &&
      u.isApproved !== false
  );

  const teamLeadOptions = domainTeamLeads.map((u) => ({
    value: u.name,
    label: `${u.name} (${(u.domain || '').toUpperCase()})`,
  }));

  /* ── submit ── */
  const handleOnboard = async () => {
    // Basic validation
    const { name, phone, email, employeeId, password, confirmPassword } = form;
    if (!name || !phone || !email || !employeeId || !password || !confirmPassword) {
      setErrorMsg('Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (!/^\d{10}$/.test(String(phone).replace(/\D/g, ''))) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      return;
    }

    if (form.aadhar && !/^\d{12}$/.test(String(form.aadhar).replace(/\D/g, ''))) {
      setErrorMsg('Aadhaar number must be exactly 12 digits.');
      return;
    }

    // Build role from designation
    const role = designation; // 'employee' | 'teamlead'

    // teamleadName required for employees
    if (role === 'employee' && !isTeamLeadCreator && !form.teamleadName) {
      setErrorMsg('Team Lead Name is required for employees.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await authService.register({
        name: form.name,
        email: form.email,
        phoneNumber: form.phone,
        address: form.address,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role,
        domain,
        designation: role,
        employeeId: form.employeeId,
        teamleadName: isTeamLeadCreator ? currentUser.name : (form.teamleadName || undefined),
        aadharNumber: form.aadhar || undefined,
        profileImage:  profileImage  ?? undefined,
        documents:     documents.length ? documents : undefined,
      });

      setStatus('success');
      setTimeout(() => {
        setForm(INITIAL_FORM);
        setProfileImage(null);
        setProfilePreview(null);
        setDocuments([]);
        setStatus('idle');
        onClose();
      }, 1400);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="w-full max-w-2xl p-6">
      <div className="max-h-[90vh] h-[85vh] overflow-y-auto scrollbar-hidden">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 px-6 pt-4 pb-3 mb-4 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {designation === 'teamlead' ? 'Team Lead' : 'Employee'} Details
              </h3>
              <p className="text-sm text-gray-500">
                Domain: <span className="font-medium capitalize">{domain}</span>
                &nbsp;·&nbsp;
                Designation: <span className="font-medium capitalize">{designation}</span>
              </p>
            </div>
            <button
              aria-label="close"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Form grid ── */}
        <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
          {/* Left — personal info */}
          <div className="flex flex-col gap-4">
            <TextInput
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name *"
            />
            <TextInput
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone Number * (10 digits)"
            />
            <TextInput
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email *"
            />
            <TextInput
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              placeholder="Employee ID *"
            />
            {designation === 'employee' && !isTeamLeadCreator && (
              <CustomSelect
                name="teamleadName"
                value={form.teamleadName}
                onChange={(e) => setForm((s) => ({ ...s, teamleadName: e.target.value }))}
                options={teamLeadOptions}
                placeholder="Team Lead Name *"
              />
            )}
            <TextInput
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
            />
            <TextInput
              name="aadhar"
              value={form.aadhar}
              onChange={handleChange}
              placeholder="Aadhaar Number (12 digits)"
            />
            
          </div>

          {/* Right — uploads */}
          <div className="space-y-4">
            {/* Profile picture */}
            <TextInput
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password *"
            />
            <TextInput
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password *"
            />
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Profile Picture</p>
              {profilePreview ? (
                <div className="relative inline-block">
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="object-cover w-24 h-24 border border-gray-200 rounded-full"
                  />
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 text-white bg-red-500 rounded-full shadow hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full gap-2 p-6 transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50"
                >
                  <Upload className="text-gray-400 w-7 h-7" />
                  <span className="text-sm text-gray-500">Upload profile photo</span>
                  <span className="text-xs text-gray-400">JPEG, PNG, WebP — max 3 MB</span>
                </button>
              )}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfileChange}
                className="hidden"
              />
            </div>

            {/* Documents */}
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Supporting Documents</p>
              <button
                type="button"
                onClick={() => docsInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full gap-2 p-5 transition-colors border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500">Add documents</span>
                <span className="text-xs text-gray-400">JPEG, PNG, PDF — max 10 MB each</span>
              </button>
              <input
                ref={docsInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleDocsChange}
                className="hidden"
              />

              {/* Attached files list */}
              {documents.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {documents.map((doc, idx) => (
                    <li key={idx} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center min-w-0 gap-2">
                        <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-gray-700 truncate">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(idx)}
                        className="ml-2 text-gray-400 shrink-0 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Error / Success messages ── */}
        {errorMsg && (
          <p className="px-3 py-2 mt-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
            {errorMsg}
          </p>
        )}
        {status === 'success' && (
          <div className="flex items-center gap-2 px-3 py-2 mt-4 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Member registered successfully!
          </div>
        )}

        {/* ── Footer ── */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-6 backdrop-blur-3xl">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleOnboard}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Onboard Member
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MemberDetailsModal;

