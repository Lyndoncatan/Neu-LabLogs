'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface RoomData {
  roomId: string;
  roomNumber: string;
  roomName: string;
}

interface UsageEntry {
  roomId: string;
  roomName: string;
  startTime: Date;
  endTime?: Date;
  numStudents: number;
  purpose: string;
  equipment: string[];
}

interface RoomUsageFormProps {
  room: RoomData | null;
  onSubmit: (entry: UsageEntry) => void;
}

export function RoomUsageForm({ room, onSubmit }: RoomUsageFormProps) {
  const [numStudents, setNumStudents] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [equipment, setEquipment] = useState('');
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [submitted, setSubmitted] = useState(false);

  if (!room) {
    return (
      <Card className="border-border border-dashed opacity-50">
        <CardHeader>
          <CardTitle>Room Usage Log</CardTitle>
          <CardDescription>Scan a room QR code to begin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Room details will appear here after scanning</p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const entry: UsageEntry = {
      roomId: room.roomId,
      roomName: room.roomName,
      startTime: new Date(startTime),
      numStudents: parseInt(numStudents) || 1,
      purpose: purpose || 'General use',
      equipment: equipment.split(',').map((e) => e.trim()).filter(Boolean),
    };

    onSubmit(entry);
    setSubmitted(true);
    setTimeout(() => {
      setNumStudents('1');
      setPurpose('');
      setEquipment('');
      setStartTime(new Date().toISOString().slice(0, 16));
      setSubmitted(false);
    }, 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Room Usage Log</span>
          <span className="text-lg font-normal text-primary">Room {room.roomNumber}</span>
        </CardTitle>
        <CardDescription>{room.roomName}</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted && (
          <div className="mb-4 flex gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Usage logged successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

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

        <div className="mt-4 p-3 bg-muted rounded-md text-xs space-y-2">
          <p className="font-semibold text-foreground">Entry Summary:</p>
          <div className="text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Students:</span> {numStudents}
            </p>
            <p>
              <span className="font-medium">Purpose:</span> {purpose || 'Not specified'}
            </p>
            <p>
              <span className="font-medium">Equipment:</span> {equipment || 'None'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
