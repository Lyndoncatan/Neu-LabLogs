'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Filter } from 'lucide-react';

interface UsageEntry {
  roomId: string;
  roomName: string;
  startTime: Date;
  endTime?: Date;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

export default function UsageReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<UsageEntry[]>([]);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
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
        const parsed = JSON.parse(storedEntries).map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
        }));
        setEntries(parsed);
        setFilteredEntries(parsed);
      }
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...entries];

    if (filterRoom) {
      filtered = filtered.filter((e) => e.roomId.includes(filterRoom) || e.roomName.includes(filterRoom));
    }

    if (filterPurpose) {
      filtered = filtered.filter((e) => e.purpose.toLowerCase().includes(filterPurpose.toLowerCase()));
    }

    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      filtered = filtered.filter((e) => new Date(e.startTime) >= startDate);
    }

    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => new Date(e.startTime) <= endDate);
    }

    setFilteredEntries(filtered);
  }, [entries, filterRoom, filterPurpose, filterStartDate, filterEndDate]);

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

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Room', 'Students', 'Purpose', 'Equipment'];
    const rows = filteredEntries.map((e) => [
      new Date(e.startTime).toLocaleDateString(),
      new Date(e.startTime).toLocaleTimeString(),
      e.roomName,
      e.numStudents,
      e.purpose,
      e.equipment.join('; '),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-usage-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Usage Reports</h1>
          <p className="text-muted-foreground">Analyze and export lab usage data with advanced filtering</p>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-filter">Room</Label>
                <Input
                  id="room-filter"
                  placeholder="Filter by room..."
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose-filter">Purpose</Label>
                <Input
                  id="purpose-filter"
                  placeholder="Filter by purpose..."
                  value={filterPurpose}
                  onChange={(e) => setFilterPurpose(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {filteredEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{filteredEntries.length}</div>
                <p className="text-xs text-muted-foreground mt-2">of {entries.length} total</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {filteredEntries.reduce((sum, e) => sum + e.numStudents, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">participations</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {new Set(filteredEntries.map((e) => e.roomId)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-2">used</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Table */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usage Data</CardTitle>
                <CardDescription>Detailed usage log entries</CardDescription>
              </div>
              {filteredEntries.length > 0 && (
                <Button onClick={handleExportCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>No entries match the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Room</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Students</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Purpose</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Equipment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(entry.startTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">{entry.roomName}</span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{entry.numStudents}</td>
                        <td className="py-3 px-4 text-muted-foreground">{entry.purpose}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {entry.equipment.length > 0 ? entry.equipment.join(', ') : '—'}
                        </td>
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
