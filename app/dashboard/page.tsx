'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { QRScanner, TeacherData } from '@/components/qr-scanner';
import { RoomUsageForm, UsageEntry } from '@/components/room-usage-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, DoorOpen, AlertTriangle, TrendingUp, Search, Sparkles } from 'lucide-react';

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
  const [scannedTeacher, setScannedTeacher] = useState<TeacherData | null>(null);
  const [entries, setEntries] = useState<UsageEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usageEntries');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendRange, setTrendRange] = useState<'7' | '14' | '30'>('7');

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

  // Auto-register teacher if they log in as professor
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.role === 'professor') {
      const storedTeachers = localStorage.getItem('teachers');
      let teachersList: any[] = storedTeachers ? JSON.parse(storedTeachers) : [];
      const exists = teachersList.some((t: any) => t.email === user.email || t.name === user.name);
      if (!exists) {
        const newTeacher = {
          id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
          name: user.name,
          department: 'Unassigned',
          status: 'active',
          email: user.email
        };
        teachersList.push(newTeacher);
        localStorage.setItem('teachers', JSON.stringify(teachersList));
      }
    }
  }, [user]);

  // =========== ADMIN ANALYTICS (Sprint 3) ===========
  const totalUsesToday = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter(e => new Date(e.startTime).toDateString() === today).length;
  }, [entries]);

  const mostActiveRoom = useMemo(() => {
    if (entries.length === 0) return 'N/A';
    const roomCounts: Record<string, number> = {};
    entries.forEach(e => {
      const key = `${e.buildingNumber}-${e.roomNumber}`;
      roomCounts[key] = (roomCounts[key] || 0) + 1;
    });
    const sorted = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  }, [entries]);

  const mostActiveRoomCount = useMemo(() => {
    if (entries.length === 0) return 0;
    const roomCounts: Record<string, number> = {};
    entries.forEach(e => {
      const key = `${e.buildingNumber}-${e.roomNumber}`;
      roomCounts[key] = (roomCounts[key] || 0) + 1;
    });
    const sorted = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] || 0;
  }, [entries]);

  const uniqueProfessors = useMemo(() => {
    return new Set(entries.map(e => e.teacherId)).size;
  }, [entries]);

  const blockedCount = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    return teachers.filter((t: any) => t.status === 'blocked').length;
  }, []);

  // Weekly usage trend data
  const trendData = useMemo(() => {
    const days = parseInt(trendRange);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayEntries = entries.filter(e => new Date(e.startTime).toDateString() === dateStr);
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uses: dayEntries.length,
      });
    }
    return data;
  }, [entries, trendRange]);

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries.slice().reverse().slice(0, 20);
    return entries.filter(e =>
      e.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.roomNumber.includes(searchQuery) ||
      e.buildingNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ).reverse().slice(0, 20);
  }, [entries, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#191970] mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // =============================================
  // ADMIN DASHBOARD (Sprint 3: Analytics)
  // =============================================
  if (user.role === 'admin') {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              iconBg="bg-blue-100 text-blue-600"
              label="TOTAL USES"
              value={entries.length}
              subtitle={`${totalUsesToday} today`}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-emerald-100 text-emerald-600"
              label="UNIQUE PROFESSORS"
              value={uniqueProfessors}
              subtitle="All time"
            />
            <StatCard
              icon={<DoorOpen className="h-5 w-5" />}
              iconBg="bg-violet-100 text-violet-600"
              label="MOST ACTIVE ROOM"
              value={mostActiveRoom}
              subtitle={mostActiveRoomCount > 0 ? `${mostActiveRoomCount} uses` : 'No data'}
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              iconBg="bg-red-100 text-red-600"
              label="BLOCKED USERS"
              value={blockedCount}
              subtitle="Requires attention"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Usage Trend Chart */}
            <Card className="lg:col-span-2 bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">Weekly Usage Trend</CardTitle>
                    <CardDescription className="text-xs text-gray-500">Usage over time</CardDescription>
                  </div>
                  <select
                    value={trendRange}
                    onChange={(e) => setTrendRange(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#191970]/20"
                  >
                    <option value="7">Last 7 Days</option>
                    <option value="14">Last 14 Days</option>
                    <option value="30">Last 30 Days</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#191970" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#191970" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #eee', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                    />
                    <Area
                      type="monotone"
                      dataKey="uses"
                      stroke="#191970"
                      strokeWidth={2.5}
                      fill="url(#usesGradient)"
                      dot={{ r: 3, fill: '#191970', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#191970', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-[#191970] to-[#0d0d50] text-white border-0 shadow-lg shadow-[#191970]/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-200/80 leading-relaxed">
                  Analyze patterns and get a generated report of this week&apos;s laboratory activity.
                </p>
                <div className="space-y-3 text-sm">
                  {entries.length > 0 ? (
                    <>
                      <div className="flex items-start gap-2 bg-white/10 rounded-lg p-3">
                        <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-300 flex-shrink-0" />
                        <span className="text-blue-100 text-xs">
                          {totalUsesToday > 0
                            ? `${totalUsesToday} check-ins today. ${mostActiveRoom !== 'N/A' ? `Room ${mostActiveRoom} is the busiest.` : ''}`
                            : 'No check-ins recorded today yet.'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 bg-white/10 rounded-lg p-3">
                        <Users className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                        <span className="text-blue-100 text-xs">
                          {uniqueProfessors} unique professor{uniqueProfessors !== 1 ? 's' : ''} have used the system.
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/10 rounded-lg p-3">
                      <span className="text-blue-100 text-xs">No data available yet. Insights will appear as professors check in.</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl text-xs"
                  onClick={() => router.push('/dashboard/usage')}
                >
                  Summarize History
                </Button>
                <p className="text-[10px] text-blue-300/50 text-center">Powered by data AI</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity with Search */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-xs text-gray-500">Live view of laboratory usage</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm rounded-lg border-gray-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEntries.length > 0 ? (
                <div className="space-y-0 text-sm">
                  <div className="grid grid-cols-5 font-medium text-gray-400 text-xs pb-2 border-b border-gray-100 mb-1 px-2 uppercase tracking-wider">
                    <div>Time</div>
                    <div>Room</div>
                    <div>Professor</div>
                    <div>Students</div>
                    <div className="text-right">Date</div>
                  </div>
                  {filteredEntries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-5 py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors text-gray-700">
                      <div className="font-medium text-gray-900">
                        {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                          {entry.buildingNumber}-{entry.roomNumber}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{entry.teacherName}</div>
                      <div>{entry.numStudents}</div>
                      <div className="text-gray-500 text-right text-xs">
                        {new Date(entry.startTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Activity className="h-10 w-10 mb-3 text-gray-300" />
                  <p className="text-sm">No usage logs found</p>
                  <p className="text-xs mt-1">Activity will appear here as professors check in</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // =============================================
  // PROFESSOR DASHBOARD (Sprint 2: Logging)
  // =============================================
  if (user.role !== 'professor') return null;

  const handleScan = (teacher: TeacherData) => {
    // Sprint 4: Check if teacher is blocked
    if (typeof window !== 'undefined') {
      const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
      const found = teachers.find((t: any) => t.id === teacher.id || t.name === teacher.name);
      if (found?.status === 'blocked') {
        alert('This account has been blocked. Please contact the administrator.');
        return;
      }
    }
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
      const updatedEntries = [...entries];
      updatedEntries[activeIndex] = { ...updatedEntries[activeIndex], endTime: new Date() };
      setEntries(updatedEntries);
    } else {
      setEntries([...entries, { ...entry, startTime: new Date() }]);
    }
    setScannedTeacher(null);
  };

  const recentEntries = entries.slice(-3).reverse();

  return (
    <DashboardLayout role="professor">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <QRScanner onScan={handleScan} isActive={!scannedTeacher} />
          <RoomUsageForm teacher={scannedTeacher} onSubmit={handleSubmit} />
        </div>

        <div className="space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">Today&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Total Entries</p>
                <p className="text-3xl font-bold text-[#191970]">{entries.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-[#191970]">
                  {entries.reduce((sum, e) => sum + e.numStudents, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-900">Recent Entries</CardTitle>
              <CardDescription className="text-xs">Last 3 logged activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg text-xs border border-gray-100">
                      <p className="font-semibold text-gray-900">Bldg {entry.buildingNumber} - Room {entry.roomNumber}</p>
                      <p className="text-gray-500 mt-1">
                        {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-gray-500">{entry.numStudents} students</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No entries yet today</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// =========== STAT CARD COMPONENT ===========
function StatCard({
  icon,
  iconBg,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  subtitle: string;
}) {
  return (
    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
