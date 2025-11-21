/**
 * Main Layout Component
 */

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector } from '../../store';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {sidebarOpen && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

