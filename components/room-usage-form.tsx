'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TeacherData } from './qr-scanner';

export interface UsageEntry {
  teacherId: string;
  teacherName: string;
  buildingNumber: string;
  roomNumber: string;
  startTime: Date;
  endTime?: Date;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

interface RoomUsageFormProps {
  teacher: TeacherData | null;
  onSubmit: (entry: UsageEntry) => void;
}

export function RoomUsageForm({ teacher, onSubmit }: RoomUsageFormProps) {
  const [buildingNumber, setBuildingNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [numStudents, setNumStudents] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [equipment, setEquipment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!teacher) {
    return (
      <Card className="border-border border-dashed opacity-50">
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>Scan your Teacher ID to begin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Teacher details will appear here after scanning</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entry: UsageEntry = {
      teacherId: teacher.id,
      teacherName: teacher.name,
      buildingNumber: buildingNumber,
      roomNumber: roomNumber,
      startTime: new Date(), // Always use current time on submit
      numStudents: parseInt(numStudents) || 1,
      purpose: purpose || 'General use',
      equipment: equipment.split(',').map((e) => e.trim()).filter(Boolean),
    };

    onSubmit(entry);
    setSubmitted(true);
    setTimeout(() => {
      setBuildingNumber('');
      setRoomNumber('');
      setNumStudents('1');
      setPurpose('');
      setEquipment('');
      setSubmitted(false);
    }, 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance Log</span>
          <span className="text-lg font-normal text-primary">{teacher.name}</span>
        </CardTitle>
        <CardDescription>{teacher.department} - {teacher.id}</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="mb-4 flex gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Usage logged successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Select value={buildingNumber} onValueChange={setBuildingNumber} required>
                  <SelectTrigger id="building">
                    <SelectValue placeholder="Select Building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IS">IS Building</SelectItem>
                    <SelectItem value="M">M Building</SelectItem>
                    <SelectItem value="PSB">PSB Building</SelectItem>
                    <SelectItem value="SOM">SOM Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  placeholder="e.g., 101, 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="students">Number of Students</Label>
                <Input
                  id="students"
                  type="number"
                  min="1"
                  max="100"
                  value={numStudents}
                  onChange={(e) => setNumStudents(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Use</Label>
              <Input
                id="purpose"
                placeholder="e.g., Experimental analysis, Lab practical"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment Used (comma-separated)</Label>
              <Input
                id="equipment"
                placeholder="e.g., Microscope, Centrifuge, Analyzer"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              Log Entry
            </Button>
          </form>
        )}
      </CardContent>
    </Card >
  );
}
