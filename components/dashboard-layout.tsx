'use client';

import React from "react"

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'professor' | 'admin';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#023E8A' }}>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-sidebar-foreground text-lg">Lab Tracker</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-sidebar-accent rounded-md transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-sidebar-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {role === 'professor' && (
            <>
              <NavLink href="/dashboard" label="Scanner" icon="📱" open={sidebarOpen} />
              <NavLink href="/dashboard/history" label="History" icon="📋" open={sidebarOpen} />
            </>
          )}
          {role === 'admin' && (
            <>
              <NavLink href="/dashboard" label="Overview" icon="📊" open={sidebarOpen} />
              <NavLink href="/dashboard/rooms" label="Rooms" icon="🏛️" open={sidebarOpen} />
              <NavLink href="/dashboard/usage" label="Usage Reports" icon="📈" open={sidebarOpen} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className={`text-xs text-sidebar-foreground ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen && (
              <>
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-sidebar-accent">{user?.role}</p>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-xs bg-transparent"
          >
            {sidebarOpen ? (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </>
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">
              {role === 'professor' ? 'Room Scanner' : 'Admin Dashboard'}
            </h2>
            <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  open: boolean;
}

function NavLink({ href, label, icon, open }: NavLinkProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      title={label}
    >
      <span className="text-lg">{icon}</span>
      {open && <span className="text-sm">{label}</span>}
    </a>
  );
}
