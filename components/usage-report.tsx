'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UsageEntry } from './room-usage-form';

export function UsageReport() {
    const [filterType, setFilterType] = useState<'all' | 'day' | 'week' | 'month'>('all');

    const generatePDF = () => {
        const doc = new jsPDF();
        const today = new Date();

        // 1. Get Logged Data
        let entries: UsageEntry[] = [];
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('usageEntries');
            if (stored) {
                entries = JSON.parse(stored);
            }
        }

        // 2. Filter Data
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.startTime);
            if (filterType === 'day') {
                return entryDate.toDateString() === today.toDateString();
            } else if (filterType === 'week') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(today.getDate() - 7);
                return entryDate >= oneWeekAgo;
            } else if (filterType === 'month') {
                return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
            }
            return true;
        });

        // 3. Generate PDF
        doc.setFontSize(18);
        doc.text('Laboratory Room Usage Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${today.toLocaleString()}`, 14, 30);
        doc.text(`Filter: ${filterType.toUpperCase()}`, 14, 36);

        const tableData = filteredEntries.map(e => [
            e.buildingNumber + '-' + e.roomNumber,
            e.teacherName,
            new Date(e.startTime).toLocaleString(),
            e.endTime ? new Date(e.endTime).toLocaleTimeString() : 'Active',
            e.numStudents.toString(),
            e.purpose
        ]);

        autoTable(doc, {
            head: [['Room', 'Teacher', 'Start Time', 'End Time', 'Students', 'Purpose']],
            body: tableData,
            startY: 44,
        });

        doc.save(`lab-usage-report-${filterType}-${today.toISOString().split('T')[0]}.pdf`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Reports</CardTitle>
                <CardDescription>Download usage logs as PDF</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end gap-4">
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Filter By</label>
                    <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="day">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generatePDF}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </CardContent>
        </Card>
    );
}
