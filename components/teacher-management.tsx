'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Ban, MoreHorizontal, Pencil, CheckCircle, Plus, Search, Users, ShieldCheck, ShieldX, UserPlus, QrCode, Download } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TeacherData } from './qr-scanner';
import { QRCodeGenerator, BulkQRGenerator } from './qr-code-generator';

export interface AdminTeacher extends TeacherData {
    status: 'active' | 'blocked' | 'hidden';
    email?: string;
}

export function TeacherManagement() {
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [newTeacher, setNewTeacher] = useState<Partial<AdminTeacher>>({ name: '', id: '', department: '' });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<AdminTeacher | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // QR Code state
    const [qrTeacher, setQrTeacher] = useState<AdminTeacher | null>(null);

    // Load teachers from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('teachers');
        if (stored) {
            setTeachers(JSON.parse(stored));
        } else {
            const initialTeachers: AdminTeacher[] = [
                { id: 'T-1001', name: 'Dr. Smith', department: 'Chemistry', status: 'active' },
                { id: 'T-1002', name: 'Prof. Johnson', department: 'Physics', status: 'active' },
                { id: 'T-1003', name: 'Dr. Williams', department: 'Biology', status: 'active' },
                { id: 'T-1004', name: 'Prof. Davis', department: 'Engineering', status: 'active' },
            ];
            setTeachers(initialTeachers);
            localStorage.setItem('teachers', JSON.stringify(initialTeachers));
        }
    }, []);

    const saveTeachers = (updatedTeachers: AdminTeacher[]) => {
        setTeachers(updatedTeachers);
        localStorage.setItem('teachers', JSON.stringify(updatedTeachers));
    };

    const handleAddTeacher = () => {
        if (newTeacher.name && newTeacher.id && newTeacher.department) {
            const teacher: AdminTeacher = {
                id: newTeacher.id,
                name: newTeacher.name,
                department: newTeacher.department,
                status: 'active'
            };
            saveTeachers([...teachers, teacher]);
            setNewTeacher({ name: '', id: '', department: '' });
            setIsAddOpen(false);
        }
    };

    // Sprint 4: Toggle block status
    const handleToggleBlock = (id: string) => {
        const updated = teachers.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    status: t.status === 'blocked' ? 'active' : 'blocked'
                } as AdminTeacher;
            }
            return t;
        });
        saveTeachers(updated);
    };

    const handleUpdateStatus = (id: string, status: 'active' | 'blocked' | 'hidden') => {
        const updated = teachers.map(t => t.id === id ? { ...t, status } : t);
        saveTeachers(updated);
    };

    const handleEditTeacher = () => {
        if (editingTeacher) {
            const updated = teachers.map(t => t.id === editingTeacher.id ? editingTeacher : t);
            saveTeachers(updated);
            setEditingTeacher(null);
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCount = teachers.filter(t => t.status === 'active').length;
    const blockedCount = teachers.filter(t => t.status === 'blocked').length;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active</p>
                                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <ShieldX className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Blocked</p>
                                <p className="text-2xl font-bold text-gray-900">{blockedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bulk QR Generator */}
            <BulkQRGenerator />

            {/* Search & Add */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search professors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-lg border-gray-200"
                    />
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#191970] hover:bg-[#191970]/90 rounded-lg gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add Professor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900">Add New Professor</DialogTitle>
                            <DialogDescription className="text-gray-500">Enter the details for the new professor account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-gray-700">Name</Label>
                                <Input id="name" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="col-span-3" placeholder="e.g., Dr. Cruz" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id" className="text-right text-gray-700">QR ID</Label>
                                <Input id="id" value={newTeacher.id} onChange={e => setNewTeacher({ ...newTeacher, id: e.target.value })} className="col-span-3" placeholder="e.g., T-1005" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dept" className="text-right text-gray-700">Dept</Label>
                                <Input id="dept" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} className="col-span-3" placeholder="e.g., Computer Science" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddTeacher} className="bg-[#191970] hover:bg-[#191970]/90">Save Professor</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Teacher Table */}
            <Card className="bg-white border-gray-200 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Professor</TableHead>
                            <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider">QR ID</TableHead>
                            <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Department</TableHead>
                            <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-gray-500 font-semibold text-xs uppercase tracking-wider text-center">Block</TableHead>
                            <TableHead className="text-right text-gray-500 font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTeachers.map((teacher) => (
                            <TableRow key={teacher.id} className={`${teacher.status === 'blocked' ? 'bg-red-50/50' : ''} hover:bg-gray-50`}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            teacher.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{teacher.name}</p>
                                            {teacher.email && <p className="text-xs text-gray-400">{teacher.email}</p>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{teacher.id}</code>
                                </TableCell>
                                <TableCell className="text-gray-700 text-sm">{teacher.department}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={teacher.status === 'active' ? 'default' : teacher.status === 'blocked' ? 'destructive' : 'secondary'}
                                        className={`text-xs ${teacher.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}
                                    >
                                        {teacher.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />}
                                        {teacher.status}
                                    </Badge>
                                </TableCell>
                                {/* Sprint 4: Block Toggle Switch */}
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center">
                                        <Switch
                                            checked={teacher.status === 'blocked'}
                                            onCheckedChange={() => handleToggleBlock(teacher.id)}
                                            className="data-[state=checked]:bg-red-500"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-500">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-white">
                                            <DropdownMenuLabel className="text-gray-500 text-xs">Actions</DropdownMenuLabel>
                                            {/* QR Code Generation */}
                                            <DropdownMenuItem onClick={() => setQrTeacher(teacher)} className="cursor-pointer">
                                                <QrCode className="mr-2 h-4 w-4 text-[#191970]" /> Generate QR Code
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setEditingTeacher(teacher)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {teacher.status !== 'active' && (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'active')} className="cursor-pointer">
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Activate
                                                </DropdownMenuItem>
                                            )}
                                            {teacher.status !== 'blocked' && (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'blocked')} className="cursor-pointer text-red-600">
                                                    <Ban className="mr-2 h-4 w-4" /> Block Account
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredTeachers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                    No professors found matching your search
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Edit Professor</DialogTitle>
                        <DialogDescription className="text-gray-500">Update professor details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right text-gray-700">Name</Label>
                            <Input
                                id="edit-name"
                                value={editingTeacher?.name || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-id" className="text-right text-gray-700">QR ID</Label>
                            <Input
                                id="edit-id"
                                value={editingTeacher?.id || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, id: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-dept" className="text-right text-gray-700">Dept</Label>
                            <Input
                                id="edit-dept"
                                value={editingTeacher?.department || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTeacher(null)}>Cancel</Button>
                        <Button onClick={handleEditTeacher} className="bg-[#191970] hover:bg-[#191970]/90">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* QR Code Generator Dialog */}
            {qrTeacher && (
                <QRCodeGenerator
                    teacher={qrTeacher}
                    open={!!qrTeacher}
                    onClose={() => setQrTeacher(null)}
                />
            )}
        </div>
    );
}
