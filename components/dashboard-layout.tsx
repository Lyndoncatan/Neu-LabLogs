'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, LayoutDashboard, Users, BookOpen, DoorOpen, BarChart3, QrCode, History, ChevronLeft } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'professor' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const adminNav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { href: '/dashboard/usage', label: 'Usage Logs', icon: BookOpen, active: pathname === '/dashboard/usage' },
    { href: '/dashboard/professors', label: 'Professors', icon: Users, active: pathname === '/dashboard/professors' },
    { href: '/dashboard/rooms', label: 'Rooms', icon: DoorOpen, active: pathname === '/dashboard/rooms' },
  ];

  const professorNav = [
    { href: '/dashboard', label: 'Scanner', icon: QrCode, active: pathname === '/dashboard' },
    { href: '/dashboard/history', label: 'History', icon: History, active: pathname === '/dashboard/history' },
  ];

  const navItems = role === 'admin' ? adminNav : professorNav;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} bg-[#191970] transition-all duration-300 flex flex-col relative`}
      >
        {/* Logo area */}
        <div className={`p-4 flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} h-16`}>
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm tracking-wide">NEU LabLog</h1>
              <p className="text-[10px] text-blue-300/70 truncate">{role === 'admin' ? 'Administrator' : 'Professor'}</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-14 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10 border border-gray-200"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`h-3 w-3 text-gray-600 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarOpen && (
            <p className="text-[10px] font-semibold text-blue-300/50 uppercase tracking-wider px-3 mb-3">Menu</p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-blue-300/60 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`w-full text-xs text-blue-200/70 hover:text-white hover:bg-white/10 mt-1 ${!sidebarOpen ? 'px-0 justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3.5 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {role === 'admin' ? 'System Dashboard' : 'Room Scanner'}
                </h2>
                <p className="text-xs text-gray-500">
                  {role === 'admin' ? `Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}` : ''}
                  {role === 'professor' ? `Welcome, ${user?.name || 'Professor'}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
