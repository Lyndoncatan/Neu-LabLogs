'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { RoomManagement } from '@/components/room-management';

interface Room {
  id: string;
  number: string;
  name: string;
  capacity: number;
  equipment: string[];
  qrCode: string;
}

export default function RoomsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleRoomsUpdate = (rooms: Room[]) => {
    // This can be used for additional processing if needed
    console.log('[v0] Rooms updated:', rooms);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Room Management</h1>
          <p className="text-muted-foreground">
            Configure lab rooms and their associated QR codes for usage tracking
          </p>
        </div>

        <RoomManagement onUpdate={handleRoomsUpdate} />
      </div>
    </DashboardLayout>
  );
}
