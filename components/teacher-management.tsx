'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Ban, MoreHorizontal, Pencil, CheckCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TeacherData } from './qr-scanner';

export interface AdminTeacher extends TeacherData {
    status: 'active' | 'blocked' | 'hidden';
}

export function TeacherManagement() {
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [newTeacher, setNewTeacher] = useState<Partial<AdminTeacher>>({ name: '', id: '', department: '' });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<AdminTeacher | null>(null);

    // Load teachers from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('teachers');
        if (stored) {
            setTeachers(JSON.parse(stored));
        } else {
            // Initialize with mock data if empty
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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Teacher Accounts</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Teacher</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Teacher</DialogTitle>
                            <DialogDescription>Enter the details for the new teacher account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id" className="text-right">ID</Label>
                                <Input id="id" value={newTeacher.id} onChange={e => setNewTeacher({ ...newTeacher, id: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dept" className="text-right">Dept</Label>
                                <Input id="dept" value={newTeacher.department} onChange={e => setNewTeacher({ ...newTeacher, department: e.target.value })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddTeacher}>Save Teacher</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-black font-semibold">Teacher</TableHead>
                            <TableHead className="text-black font-semibold">ID</TableHead>
                            <TableHead className="text-black font-semibold">Department</TableHead>
                            <TableHead className="text-black font-semibold">Status</TableHead>
                            <TableHead className="text-right text-black font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id} className={teacher.status === 'hidden' ? 'opacity-50 bg-muted/50 text-black' : 'text-black'}>
                                <TableCell className="font-medium text-black">{teacher.name}</TableCell>
                                <TableCell className="text-black">{teacher.id}</TableCell>
                                <TableCell className="text-black">{teacher.department}</TableCell>
                                <TableCell>
                                    <Badge variant={teacher.status === 'active' ? 'default' : teacher.status === 'blocked' ? 'destructive' : 'secondary'}>
                                        {teacher.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-black">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => setEditingTeacher(teacher)}>
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {teacher.status !== 'active' && (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'active')}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Activate
                                                </DropdownMenuItem>
                                            )}
                                            {teacher.status !== 'blocked' && (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'blocked')}>
                                                    <Ban className="mr-2 h-4 w-4 text-destructive" /> Block Account
                                                </DropdownMenuItem>
                                            )}
                                            {teacher.status !== 'hidden' ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'hidden')}>
                                                    <EyeOff className="mr-2 h-4 w-4" /> Hide from Lists
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(teacher.id, 'active')}>
                                                    <Eye className="mr-2 h-4 w-4" /> Unhide
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Teacher</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name</Label>
                            <Input
                                id="edit-name"
                                value={editingTeacher?.name || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-id" className="text-right">ID</Label>
                            <Input
                                id="edit-id"
                                value={editingTeacher?.id || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, id: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-dept" className="text-right">Dept</Label>
                            <Input
                                id="edit-dept"
                                value={editingTeacher?.department || ''}
                                onChange={e => setEditingTeacher(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEditTeacher}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
