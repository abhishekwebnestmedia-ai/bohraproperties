import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getCurrentUser } from '../../utils/auth';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const user = getCurrentUser();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        userRole={user.role}
        userDomain={user.domain}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col h-screen md:ml-20">
        {/* Header */}
        <Header
          userName={user.name}
          userEmail={user.email}
          profileImage={user.profileImage}
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />

        {/* Content Area with Scroll */}
        <main className="flex-1 p-4 mt-16 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
