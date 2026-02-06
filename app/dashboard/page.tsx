'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QRScanner } from '@/components/qr-scanner';
import { RoomUsageForm } from '@/components/room-usage-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoomData {
  roomId: string;
  roomNumber: string;
  roomName: string;
}

interface UsageEntry {
  roomId: string;
  roomName: string;
  startTime: Date;
  endTime?: Date;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

interface Room {
  id: string;
  number: string;
  name: string;
  capacity: number;
  equipment: string[];
  qrCode: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scannedRoom, setScannedRoom] = useState<RoomData | null>(null);
  const [entries, setEntries] = useState<UsageEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usageEntries');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('usageEntries', JSON.stringify(entries));
    }
  }, [entries]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'admin') {
      const storedRooms = localStorage.getItem('labRooms');
      if (storedRooms) {
        setRooms(JSON.parse(storedRooms));
      }
    }
  }, [user?.role]);

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

  if (!user) {
    return null;
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    const totalEntries = entries.length;
    const totalStudents = entries.reduce((sum, e) => sum + e.numStudents, 0);
    const activeRooms = new Set(entries.map((e) => e.roomId)).size;
    const avgStudentsPerEntry = totalEntries > 0 ? (totalStudents / totalEntries).toFixed(1) : '0';

    const roomUsageData = rooms.map((room) => {
      const roomEntries = entries.filter((e) => e.roomId === room.id);
      return {
        name: `Room ${room.number}`,
        entries: roomEntries.length,
        students: roomEntries.reduce((sum, e) => sum + e.numStudents, 0),
      };
    });

    const purposeData = Array.from(
      entries.reduce((acc, e) => {
        const purpose = e.purpose || 'Unspecified';
        acc.set(purpose, (acc.get(purpose) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).map(([purpose, count]) => ({ purpose, count }));

    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalEntries}</div>
                <p className="text-xs text-muted-foreground mt-2">room access logs</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-2">student participations</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{activeRooms}</div>
                <p className="text-xs text-muted-foreground mt-2">of {rooms.length} rooms</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Students/Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{avgStudentsPerEntry}</div>
                <p className="text-xs text-muted-foreground mt-2">per session</p>
              </CardContent>
            </Card>
          </div>

          {entries.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roomUsageData.some((r) => r.entries > 0) && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Room Usage</CardTitle>
                    <CardDescription>Number of entries and students per room</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={roomUsageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                        <YAxis stroke="var(--color-muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="entries" fill="var(--color-primary)" />
                        <Bar dataKey="students" fill="var(--color-accent)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {purposeData.length > 0 && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle>Usage by Purpose</CardTitle>
                    <CardDescription>Distribution of room use purposes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {purposeData.map((item) => (
                        <div key={item.purpose} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.purpose}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(item.count / totalEntries) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-foreground w-8">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {entries.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No usage data yet</p>
                  <p className="text-sm text-muted-foreground">Usage entries from professors will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Professor Dashboard
  if (user.role !== 'professor') {
    return null;
  }

  const handleScan = (room: RoomData) => {
    setScannedRoom(room);
  };

  const handleSubmit = (entry: UsageEntry) => {
    setEntries([...entries, { ...entry, startTime: new Date(entry.startTime) }]);
    setScannedRoom(null);
  };

  const recentEntries = entries.slice(-3).reverse();

  return (
    <DashboardLayout role="professor">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner and Form */}
        <div className="lg:col-span-2 space-y-6">
          <QRScanner onScan={handleScan} isActive={!scannedRoom} />
          <RoomUsageForm room={scannedRoom} onSubmit={handleSubmit} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-3xl font-bold text-primary">{entries.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rooms Used</p>
                <p className="text-3xl font-bold text-primary">
                  {new Set(entries.map((e) => e.roomId)).size}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-primary">
                  {entries.reduce((sum, e) => sum + e.numStudents, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <CardDescription>Last 3 logged activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry, idx) => (
                    <div key={idx} className="p-2 bg-muted rounded-md text-xs border border-border">
                      <p className="font-semibold text-foreground">{entry.roomName}</p>
                      <p className="text-muted-foreground">
                        {new Date(entry.startTime).toLocaleTimeString()}
                      </p>
                      <p className="text-muted-foreground">{entry.numStudents} students</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No entries yet today</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
