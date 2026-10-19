import { useState, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useLogout } from '../../hooks/useAuth';

interface SidebarProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'TEAMLEAD' | 'EMPLOYEE';
  userDomain?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface MenuItem {
  iconSrc?: string;
  label: string;
  path: string;
  roles: string[];
  domains?: string[]; // Optional domain filter
}

const Sidebar = ({ userRole, userDomain, mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const location = useLocation();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = () => {
    onMobileClose?.();
    setShowLogoutConfirm(false);
    logout();
  };

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    hoverTimer.current = setTimeout(() => setIsExpanded(true), 450);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    closeTimerRef.current = setTimeout(() => setIsExpanded(false), 300);
  }, []);

  // Menu items based on user roles
  // Use icons from public/Super Admin in this exact order
  const menuItems: MenuItem[] = [
    { iconSrc: '/Super Admin/icons.svg', label: 'Dashboard', path: '/dashboard', roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'] },
    { iconSrc: '/Super Admin/icons-1.svg', label: 'Operation', path: '/operation', roles: ['SUPERADMIN', 'ADMIN'] },
    { iconSrc: '/Super Admin/icons-2.svg', label: 'Lead', path: '/properties', roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'], domains: ['property'] },
    { iconSrc: '/Super Admin/icons-3.svg', label: 'Finance', path: '/finance', roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'], domains: ['finance'] },
    { iconSrc: '/Super Admin/icons-2.svg', label: 'Inventory', path: '/inventory', roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD', 'EMPLOYEE'], domains: ['property'] },
    { iconSrc: '/Super Admin/icons-4.svg', label: 'Teams', path: '/team', roles: ['SUPERADMIN', 'ADMIN', 'TEAMLEAD'] },
  ];

  // Filter menu items based on user role and domain
  const filteredMenuItems = menuItems.filter((item) => {
    // Check if user's role is allowed
    const hasRoleAccess = item.roles.includes(userRole);
    
    // If item has domain restriction, check user's domain
    if (item.domains && item.domains.length > 0) {
      // For SUPERADMIN and ADMIN, show all domain-specific items
      if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') {
        return hasRoleAccess;
      }
      // For TEAMLEAD and EMPLOYEE, only show items matching their domain
      return hasRoleAccess && userDomain && item.domains.includes(userDomain.toLowerCase());
    }
    
    return hasRoleAccess;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-50 overflow-hidden flex flex-col justify-between
          ${isExpanded ? 'md:w-64' : 'md:w-19'}
          w-72
          ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
        `}
      >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg">
            <img src="/logoshort.svg" alt="Webnest Properties" className="object-contain w-10 h-10" />
          </div> */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isExpanded || mobileOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap ">
              WebNest Media
            </h1>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-2.5 ">
        <ul className="">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onMobileClose}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FEF9C3] text-yellow-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                    {item.iconSrc && (
                      <img src={item.iconSrc} alt={item.label} className={`w-5 h-5 object-contain ${isActive ? 'mix-blend-difference' : 'opacity-80 mix-blend-luminosity'}`} />
                    )}
                  </div>
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      isExpanded || mobileOpen ? 'opacity-100' : 'opacity-0 w-0'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-200">
        <LogoutButton
          isExpanded={isExpanded || mobileOpen}
          disabled={isLoggingOut}
          onLogoutRequest={() => setShowLogoutConfirm(true)}
        />
      </div>

      {/* Webnest branding - shown only when sidebar is expanded */}
      <div
        className={`px-3 pr-0 flex flex-row items-center gap-2 overflow-hidden transition-all duration-300 ${
          isExpanded || mobileOpen ? 'max-h-20 opacity-100 pb-3' : 'max-h-0 opacity-0 pb-0 pointer-events-none'
        }`}
      >
                  <span className="whitespace-nowrap text-sm text-gray-500">
            Powered by
          </span>
        <a
          href="https://webnestmedia.in/"
          target="_blank"
          rel="noopener noreferrer"
          title="Webnest Media"
          className="flex items-center gap-2 py-2 rounded-lg"
        >
          <img
            src="/webnest.svg"
            alt="Webnest"
            className="flex-shrink-0 h-8 w-auto object-contain"
          />

        </a>
      </div>
    </aside>

    {/* Logout confirmation modal – rendered OUTSIDE <aside> to escape the CSS transform stacking context */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        />
        <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-red-600" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {isLoggingOut ? 'Logging out…' : 'Yes, Logout'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

const LogoutButton = ({
  isExpanded,
  onLogoutRequest,
  disabled = false,
}: {
  isExpanded: boolean;
  onLogoutRequest: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onLogoutRequest}
      disabled={disabled}
      className="flex items-center w-full gap-4 px-4 py-3 text-gray-600 transition-all duration-200 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className="flex-shrink-0 w-5 h-5" />
      <span
        className={`whitespace-nowrap transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0 w-0'
        }`}
      >
        Logout
      </span>
    </button>
  );
};

export default Sidebar;
