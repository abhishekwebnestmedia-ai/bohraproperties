import { User, LogOut, ChevronDown, Bell, Check, CheckCheck, Settings, AlertTriangle, Menu } from 'lucide-react';
import { Calendar } from 'react-iconly';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../hooks/useAuth';
import TaskPanel from '../task/TaskPanel';
import { useNotifications } from '../../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface HeaderProps {
  userName: string;
  userEmail?: string;
  profileImage?: string | null;
  onMobileMenuToggle?: () => void;
}

const Header = ({ userName, userEmail, profileImage, onMobileMenuToggle }: HeaderProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead, connected, lastError } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => logout();

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 md:left-20 z-40 px-4 md:px-8">
      <div className="h-full flex items-center justify-between">
        {/* Welcome Message */}
        <div className="flex items-center gap-2">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            Hi, {userName}!
          </h2>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-4">
          {/* Calendar Icon */}
          <button 
            onClick={() => setShowTaskPanel(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          >
            <Calendar set="light" size={20} />
          </button>

          {/* Message Icon */}
          {/* Message icon removed (per requirement) */}

          {/* Notification Bell Icon */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((s) => !s)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold leading-4.5 text-center rounded-full ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      connected 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Connection error */}
                {!connected && lastError && (
                  <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                    <p className="text-[11px] text-red-600 truncate" title={lastError}>
                      {lastError}
                    </p>
                  </div>
                )}

                {/* Notification list */}
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Bell className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                      <p className="text-xs text-gray-300 mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { markRead(n.id); setShowNotifications(false); }}
                        className={`w-full text-left px-4 py-3 transition-colors group ${
                          n.read 
                            ? 'hover:bg-gray-50' 
                            : 'bg-blue-50/40 hover:bg-blue-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Read indicator */}
                          <div className="mt-1.5 shrink-0">
                            {n.read ? (
                              <Check className="w-3.5 h-3.5 text-gray-300" />
                            ) : (
                              <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${
                                n.read ? 'font-normal text-gray-600' : 'font-semibold text-gray-900'
                              }`}>
                                {n.title}
                              </p>
                              <p className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                                {dayjs(n.createdAt).isValid() ? dayjs(n.createdAt).fromNow() : ''}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 20 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
                    <p className="text-[11px] text-gray-400">
                      Showing 20 of {notifications.length} notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
                </div>
                <button
                  onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Panel */}
      <TaskPanel isOpen={showTaskPanel} onClose={() => setShowTaskPanel(false)} />

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-linear-to-r from-red-500 to-red-600" />
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Logout</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to log out? Any unsaved changes will be lost.
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
