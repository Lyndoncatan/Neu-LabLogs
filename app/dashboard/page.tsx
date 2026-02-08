'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QRScanner, TeacherData } from '@/components/qr-scanner';
import { RoomUsageForm, UsageEntry } from '@/components/room-usage-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Room {
  id: string;
  number: string;
  name: string;
  capacity: number;
  equipment: string[];
  qrCode: string; // Kept for admin reference if needed
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scannedTeacher, setScannedTeacher] = useState<TeacherData | null>(null);
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
    // Active teachers = unique teacherIds in entries from 'today' (simplified for now to all entries)
    const activeTeachers = new Set(entries.map((e) => e.teacherId)).size;
    const avgStudentsPerEntry = totalEntries > 0 ? (totalStudents / totalEntries).toFixed(1) : '0';

    const buildingUsageData = Array.from(
      entries.reduce((acc, e) => {
        const building = e.buildingNumber || 'Unknown';
        acc.set(building, (acc.get(building) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).map(([name, count]) => ({ name, count }));

    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalEntries}</div>
                <p className="text-xs text-muted-foreground mt-2">logged sessions</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-2">total attendance</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{activeTeachers}</div>
                <p className="text-xs text-muted-foreground mt-2">using labs</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Class Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{avgStudentsPerEntry}</div>
                <p className="text-xs text-muted-foreground mt-2">students per session</p>
              </CardContent>
            </Card>
          </div>

          {entries.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-border h-full">
                  <CardHeader>
                    <CardTitle>Usage Log</CardTitle>
                    <CardDescription>Recent laboratory activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {entries.slice().reverse().map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-semibold">{entry.teacherName}</p>
                            <p className="text-sm text-muted-foreground">
                              Bldg {entry.buildingNumber}, Room {entry.roomNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {new Date(entry.startTime).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-border h-full">
                  <CardHeader>
                    <CardTitle>Building Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={buildingUsageData}>
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
                        <Bar dataKey="count" fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No usage data yet</p>
                  <p className="text-sm text-muted-foreground">Teacher logs will appear here</p>
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

  const handleScan = (teacher: TeacherData) => {
    setScannedTeacher(teacher);
  };

  const handleSubmit = (entry: UsageEntry) => {
    const activeIndex = entries.findIndex(e =>
      e.teacherId === entry.teacherId &&
      e.buildingNumber === entry.buildingNumber &&
      e.roomNumber === entry.roomNumber &&
      !e.endTime
    );

    if (activeIndex >= 0) {
      // Check Out
      const updatedEntries = [...entries];
      updatedEntries[activeIndex] = {
        ...updatedEntries[activeIndex],
        endTime: new Date()
      };
      setEntries(updatedEntries);
    } else {
      // Check In
      setEntries([...entries, { ...entry, startTime: new Date() }]);
    }
    setScannedTeacher(null);
  };

  const recentEntries = entries.slice(-3).reverse();

  return (
    <DashboardLayout role="professor">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner and Form */}
        <div className="lg:col-span-2 space-y-6">
          <QRScanner onScan={handleScan} isActive={!scannedTeacher} />
          <RoomUsageForm teacher={scannedTeacher} onSubmit={handleSubmit} />
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
                      <p className="font-semibold text-foreground">Bldg {entry.buildingNumber} - Room {entry.roomNumber}</p>
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
