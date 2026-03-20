'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Filter, Search, FileText, Users, DoorOpen, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UsageEntry {
  teacherId: string;
  teacherName: string;
  buildingNumber: string;
  roomNumber: string;
  startTime: string;
  endTime?: string;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

export default function UsageReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEntries = localStorage.getItem('usageEntries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    }
  }, []);

  // Get unique rooms for filter
  const uniqueRooms = useMemo(() => {
    const rooms = new Set(entries.map(e => `${e.buildingNumber}-${e.roomNumber}`));
    return Array.from(rooms);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];
    const today = new Date();

    // Date range filter
    if (filterDateRange === 'day') {
      filtered = filtered.filter(e => new Date(e.startTime).toDateString() === today.toDateString());
    } else if (filterDateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      filtered = filtered.filter(e => new Date(e.startTime) >= weekAgo);
    } else if (filterDateRange === 'month') {
      filtered = filtered.filter(e => {
        const d = new Date(e.startTime);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
    }

    // Custom date range
    if (filterStartDate) {
      filtered = filtered.filter(e => new Date(e.startTime) >= new Date(filterStartDate));
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => new Date(e.startTime) <= end);
    }

    // Room filter
    if (filterRoom !== 'all') {
      filtered = filtered.filter(e => `${e.buildingNumber}-${e.roomNumber}` === filterRoom);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.roomNumber.includes(searchQuery) ||
        e.buildingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [entries, searchQuery, filterRoom, filterDateRange, filterStartDate, filterEndDate]);

  // Stats
  const totalStudents = filteredEntries.reduce((sum, e) => sum + e.numStudents, 0);
  const uniqueProfessors = new Set(filteredEntries.map(e => e.teacherId)).size;
  const uniqueRoomsCount = new Set(filteredEntries.map(e => `${e.buildingNumber}-${e.roomNumber}`)).size;

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const today = new Date();

    doc.setFontSize(18);
    doc.text('NEU Laboratory Usage Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${today.toLocaleString()}`, 14, 30);
    doc.text(`Filter: ${filterDateRange.toUpperCase()} | Entries: ${filteredEntries.length}`, 14, 36);

    const tableData = filteredEntries.map(e => [
      new Date(e.startTime).toLocaleDateString(),
      new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      `${e.buildingNumber}-${e.roomNumber}`,
      e.teacherName,
      e.numStudents.toString(),
      e.purpose || 'N/A',
    ]);

    autoTable(doc, {
      head: [['Date', 'Time', 'Room', 'Professor', 'Students', 'Purpose']],
      body: tableData,
      startY: 44,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 25, 112] },
    });

    doc.save(`neu-lab-report-${today.toISOString().split('T')[0]}.pdf`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Room', 'Professor', 'Students', 'Purpose', 'Equipment'];
    const rows = filteredEntries.map(e => [
      new Date(e.startTime).toLocaleDateString(),
      new Date(e.startTime).toLocaleTimeString(),
      `${e.buildingNumber}-${e.roomNumber}`,
      e.teacherName,
      e.numStudents,
      e.purpose,
      e.equipment?.join('; ') || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neu-lab-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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

  if (!user || user.role !== 'admin') return null;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usage Logs</h1>
            <p className="text-sm text-gray-500 mt-1">Search, filter, and export lab usage data</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="gap-2 rounded-lg" disabled={filteredEntries.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2 rounded-lg bg-[#191970] hover:bg-[#191970]/90" disabled={filteredEntries.length === 0}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 space-y-1.5">
                <Label className="text-xs text-gray-500">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Professor name or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 rounded-lg border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Room</Label>
                <Select value={filterRoom} onValueChange={setFilterRoom}>
                  <SelectTrigger className="rounded-lg border-gray-200">
                    <SelectValue placeholder="All Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {uniqueRooms.map(room => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Date Range</Label>
                <Select value={filterDateRange} onValueChange={(v: any) => setFilterDateRange(v)}>
                  <SelectTrigger className="rounded-lg border-gray-200">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Custom Start</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="rounded-lg border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Filtered Entries</p>
                  <p className="text-xl font-bold text-gray-900">{filteredEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Total Students</p>
                  <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Unique Professors</p>
                  <p className="text-xl font-bold text-gray-900">{uniqueProfessors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <DoorOpen className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Unique Rooms</p>
                  <p className="text-xl font-bold text-gray-900">{uniqueRoomsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">Usage Data</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              {filteredEntries.length} of {entries.length} total entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Calendar className="h-12 w-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No entries match the selected filters</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Room</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Professor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Students</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-gray-900 font-medium text-xs">{new Date(entry.startTime).toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs">{new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                            {entry.buildingNumber}-{entry.roomNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 font-medium text-sm">{entry.teacherName}</td>
                        <td className="py-3 px-4 text-gray-700">{entry.numStudents}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{entry.purpose || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
