// Example: How to add User Registration to TeamPage.tsx

import { useState } from 'react';
import { useRegister, useUsers, useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';

// Add this component to your TeamPage
const AddUserModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { mutate: register, isPending, error, isSuccess } = useRegister();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    domain: 'property',
    designation: 'employee',
    employeeId: '',
    teamleadName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(formData, {
      onSuccess: () => {
        // Close modal and reset form
        onClose();
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          address: '',
          password: '',
          confirmPassword: '',
          role: 'employee',
          domain: 'property',
          designation: 'employee',
          employeeId: '',
          teamleadName: '',
        });
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Only show teamlead field for employees
  const showTeamleadField = formData.role === 'employee';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {isSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">User registered successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Employee ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee ID *
          </label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role - Only show if user is admin or superadmin */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="teamlead">Team Lead</option>
              {user?.role === 'superadmin' && <option value="admin">Admin</option>}
            </select>
          </div>
        )}

        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domain *
          </label>
          <select
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="property">Property</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        {/* Designation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Designation *
          </label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Team Lead Name - Only for employees */}
        {showTeamleadField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Lead Name (Optional)
            </label>
            <input
              type="text"
              name="teamleadName"
              value={formData.teamleadName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPending ? 'Registering...' : 'Register User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// In your TeamPage component, add:
const TeamPage = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const { user } = useAuth();
  const { data: usersData, isLoading } = useUsers();

  // Only show "Add User" button for admin/superadmin
  const canAddUser = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div>
      {/* Header with Add User button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        {canAddUser && (
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add User
          </button>
        )}
      </div>

      {/* User List */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {usersData?.users.map((user) => (
            <div key={user._id} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal isOpen={showAddUser} onClose={() => setShowAddUser(false)} />
    </div>
  );
};

export default TeamPage;
