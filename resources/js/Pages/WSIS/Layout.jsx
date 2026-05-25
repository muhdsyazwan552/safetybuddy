import { useState } from 'react'; // <-- This import was missing
import Navbar from '../Layouts_Admin/Navbar';
import Sidebar from '../Layouts_Admin/Sidebar';
import Toast from '@/Components/Toast';


export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          title={title}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
        <Toast />
      </div>
    </div>
  );
}