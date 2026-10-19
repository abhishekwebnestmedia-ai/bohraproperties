import { useState, useRef, useEffect } from 'react';
import {
  Camera, User, Mail, Phone, Briefcase, Building2, BadgeCheck,
  Save, Loader2, MapPin, CreditCard, Users, Calendar, CheckCircle2, XCircle,
  Shield, TrendingUp,
} from 'lucide-react';
import { getCurrentUser } from '../../utils/auth';
import authService from '../../services/authService';

const ProfilePage = () => {
  const baseUser = getCurrentUser();

  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [name, setName] = useState(baseUser.name);
  const [email, setEmail] = useState(baseUser.email);
  const [phone, setPhone] = useState(baseUser.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(baseUser.profileImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authService.getMe().then((res) => {
      if (res.success && res.data) {
        const d = res.data as any;
        setFullProfile(d);
        setName(d.name || baseUser.name);
        setEmail(d.email || baseUser.email);
        setPhone(d.phoneNumber || '');
        setAddress(d.address || '');
        setAadharNumber(d.aadharNumber || '');
        if (d.profileImage) setProfileImage(d.profileImage);
      }
    }).catch(() => {}).finally(() => setProfileLoading(false));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await authService.updateUser(baseUser.id, {
        name: name || undefined,
        email: email || undefined,
        phoneNumber: phone || undefined,
        ...({ address: address || undefined } as any),
        ...({ aadharNumber: aadharNumber || undefined } as any),
      });

      if (selectedFile) {
        const fd = new FormData();
        fd.append('profileImage', selectedFile);
        const api = (await import('../../services/api')).default;
        const imgRes = await api.put(`/auth/update-user/${baseUser.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (imgRes.data?.data?.profileImage) {
          setProfileImage(
            typeof imgRes.data.data.profileImage === 'string' ? imgRes.data.data.profileImage : null
          );
        }
      }

      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.name = name;
      stored.email = email;
      stored.phoneNumber = phone;
      if (profileImage) stored.profileImage = profileImage;
      localStorage.setItem('user', JSON.stringify(stored));
      window.dispatchEvent(new Event('auth:changed'));

      setMessage({ type: 'success', text: res.message || 'Profile updated successfully' });
      setFullProfile((prev: any) => ({
        ...prev,
        name, email, phoneNumber: phone, address, aadharNumber,
      }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const fp = fullProfile;
  const displayName = fp?.name || baseUser.name || 'User';
  const displayRole = fp?.role || baseUser.role || '';
  const displayInitials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  // Profile completion percentage
  const completionFields = [displayName, fp?.email, fp?.phoneNumber, fp?.address, fp?.aadharNumber, fp?.profileImage];
  const completedCount = completionFields.filter(Boolean).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  const InfoBadge = ({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white text-gray-500 shadow-sm shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 capitalize truncate">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and preferences</p>
      </div>

      {profileLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Avatar + quick info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Banner */}
              <div className="h-20 bg-linear-to-r from-blue-500 to-indigo-600" />
              <div className="px-5 pb-5">
                <div className="-mt-10 mb-4 flex items-end gap-3">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md">
                      {profileImage ? (
                        <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{displayInitials}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
                <h2 className="text-base font-semibold text-gray-900">{displayName}</h2>
                <p className="text-sm text-gray-500 capitalize">{fp?.designation || displayRole}</p>

                <div className="mt-3 flex items-center gap-1.5">
                  {fp?.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <XCircle className="w-3 h-3" /> Pending
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                    {fp?.domain || 'property'}
                  </span>
                </div>

                {fp?.createdAt && (
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(fp.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}

                {/* Profile completion */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Profile Completion
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{completionPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Details</h3>
              <div className="space-y-2">
                <InfoBadge label="Role" value={fp?.role || baseUser.role} icon={<BadgeCheck className="w-4 h-4" />} />
                <InfoBadge label="Designation" value={fp?.designation} icon={<Briefcase className="w-4 h-4" />} />
                <InfoBadge label="Domain" value={fp?.domain} icon={<Building2 className="w-4 h-4" />} />
                <InfoBadge label="Employee ID" value={fp?.employeeId} icon={<CreditCard className="w-4 h-4" />} />
                {fp?.teamleadName && (
                  <InfoBadge label="Team Lead" value={fp.teamleadName} icon={<Users className="w-4 h-4" />} />
                )}
              </div>
            </div>
          </div>

          {/* Right — Editable fields */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Identity Details</h3>
              <p className="text-xs text-gray-400 mb-4">This information is used for verification and is kept secure.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Aadhar Number</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="12-digit Aadhar number"
                      maxLength={12}
                      inputMode="numeric"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {message && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving' : 'Save Changes'}
                </button>
                <p className="text-xs text-gray-400">Changes will be reflected immediately</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
