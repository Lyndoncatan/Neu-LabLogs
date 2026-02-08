'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QRScanner, TeacherData } from '@/components/qr-scanner';
import { RoomUsageForm, UsageEntry } from '@/components/room-usage-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeacherManagement } from '@/components/teacher-management';
import { UsageReport } from '@/components/usage-report';
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

  // Auto-register teacher if they log in
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'professor') {
      const storedTeachers = localStorage.getItem('teachers');
      let teachersList: any[] = storedTeachers ? JSON.parse(storedTeachers) : [];

      const exists = teachersList.some((t: any) => t.email === user.email || t.name === user.name);

      if (!exists) {
        // Create a basic ID if one doesn't exist, using timestamp or similar for uniqueness
        const newTeacher = {
          id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
          name: user.name,
          department: 'Unassigned', // Default
          status: 'active',
          email: user.email // Store email to match better if needed
        };
        teachersList.push(newTeacher);
        localStorage.setItem('teachers', JSON.stringify(teachersList));
      }
    }
  }, [user]);

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
    return (
      <DashboardLayout role="admin">
        <Tabs defaultValue="teachers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-black">Admin Dashboard</h2>
            <TabsList className="bg-zinc-100 p-1">
              <TabsTrigger
                value="teachers"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500"
              >
                Manage Accounts
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500"
              >
                Attendance Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="teachers">
            <TeacherManagement />
          </TabsContent>

          <TabsContent value="logs">
            <div className="space-y-6">
              {/* Report Controls */}
              <UsageReport />

              {/* Live Data Table */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-black">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-500">Live view of laboratory usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {entries.length > 0 ? (
                    <div className="space-y-0 text-sm">
                      <div className="grid grid-cols-5 font-semibold text-gray-500 pb-2 border-b mb-2 px-2">
                        <div className="col-span-1">Time</div>
                        <div className="col-span-1">Room</div>
                        <div className="col-span-1">Teacher</div>
                        <div className="col-span-1">Students</div>
                        <div className="col-span-1 text-right">Date</div>
                      </div>
                      {entries.slice().reverse().map((entry, idx) => (
                        <div key={idx} className="grid grid-cols-5 py-3 hover:bg-muted/50 rounded-md px-2 transition-colors border-b last:border-0 border-dashed text-black">
                          <div className="col-span-1 font-medium">
                            {new Date(entry.startTime).toLocaleTimeString()}
                          </div>
                          <div className="col-span-1">
                            {entry.buildingNumber}-{entry.roomNumber}
                          </div>
                          <div className="col-span-1 font-medium text-black">
                            {entry.teacherName}
                          </div>
                          <div className="col-span-1">
                            {entry.numStudents}
                          </div>
                          <div className="col-span-1 text-gray-500 text-right">
                            {new Date(entry.startTime).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No usage logs found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
