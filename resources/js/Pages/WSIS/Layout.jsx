import { useState } from 'react';
import Navbar from '../Layouts_Admin/Navbar';
import Sidebar from '../Layouts_Admin/Sidebar';
import Toast from '@/Components/Toast';

export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-gray-100 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Navbar
          title={title}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          {children}
        </main>
        <Toast />
      </div>
    </div>
  );
}
