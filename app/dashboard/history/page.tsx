'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface UsageEntry {
  roomId: string;
  roomName: string;
  startTime: Date;
  endTime?: Date;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

export default function HistoryPage() {
  const { user, loading } = useRouter();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [entries, setEntries] = useState<UsageEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('usageEntries');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/');
    }
  }, [authUser, loading, router]);

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

  if (!authUser || authUser.role !== 'professor') {
    return null;
  }

  const handleDelete = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    localStorage.setItem('usageEntries', JSON.stringify(newEntries));
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return (
    <DashboardLayout role="professor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Usage History</h1>
          <p className="text-muted-foreground">View and manage all logged room usage</p>
        </div>

        {entries.length === 0 ? (
          <Card className="border-border border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No usage entries yet</p>
                <Button variant="outline">
                  <a href="/dashboard">Start Scanning</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{entries.length}</div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Student Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {entries.reduce((sum, e) => sum + e.numStudents, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rooms Accessed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {new Set(entries.map((e) => e.roomId)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>All Entries</CardTitle>
                <CardDescription>Complete log of room usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{entry.roomName}</h3>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Room {entry.roomId.split('-')[1]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.startTime).toLocaleString()}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>👥 {entry.numStudents} students</span>
                          <span>📝 {entry.purpose}</span>
                          {entry.equipment.length > 0 && (
                            <span>🔧 {entry.equipment.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entries.indexOf(entry))}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
