'use client';

import React from "react"

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, CheckCircle } from 'lucide-react';

export interface TeacherData {
  id: string;
  name: string;
  department: string;
}

interface ScanResult {
  teacher: TeacherData;
  scannedAt: Date;
}

interface QRScannerProps {
  onScan: (teacher: TeacherData) => void;
  isActive: boolean;
}

export function QRScanner({ onScan, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock Teacher Database
  const TEACHER_DB: { [key: string]: TeacherData } = {
    'teacher-1': { id: 'T-1001', name: 'Dr. Smith', department: 'Chemistry' },
    'teacher-2': { id: 'T-1002', name: 'Prof. Johnson', department: 'Physics' },
    'teacher-3': { id: 'T-1003', name: 'Dr. Williams', department: 'Biology' },
    'teacher-4': { id: 'T-1004', name: 'Prof. Davis', department: 'Engineering' },
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      setCameraActive(true);
      setError('');
    } catch (err: any) {
      // Detailed error handling
      let errorMessage = 'Cannot access camera.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is currently in use by another application.';
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = 'Camera requires HTTPS. Please use the secure Vercel link.';
      }

      setError(`${errorMessage} (${err.name})`);
      console.error('[App] Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const processQRCode = (qrValue: string) => {
    // 1. Try to parse as CSV: "Department,Fullname,Code"
    const parts = qrValue.split(',');

    if (parts.length === 3) {
      const [department, name, id] = parts.map(s => s.trim());
      const teacher: TeacherData = {
        id,
        name,
        department
      };

      onScan(teacher);
      setSuccess(`Scanned: ${teacher.name}`);
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      setManualInput('');
      stopCamera();
      return;
    }

    // 2. Fallback: Check Mock DB (for backward compatibility or testing)
    const teacher = TEACHER_DB[qrValue];
    if (teacher) {
      onScan(teacher);
      setSuccess(`Scanned: ${teacher.name}`);
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      setManualInput('');
      stopCamera();
    } else {
      setError(`Invalid Format. Expected "Department,Name,ID". Scanned: ${qrValue}`);
    }
  };

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processQRCode(manualInput.trim().toLowerCase());
    }
  };

  // Simulate QR code scanning from video
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Simulate QR detection
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // In a real app, you would pass imageData to a library like jsQR
    }, 100);

    return () => clearInterval(interval);
  }, [cameraActive]);

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Teacher ID Scanner
          </CardTitle>
          <CardDescription>Scan your Teacher ID to log presence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!isActive ? (
            <div className="text-center p-6 bg-muted rounded-md border border-dashed">
              <p className="text-muted-foreground">Scan complete</p>
              <Button variant="link" onClick={() => window.location.reload()}>Scan again</Button>
            </div>
          ) : cameraActive ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full"
                />
                <div className="absolute inset-0 border-4 border-primary opacity-30 m-12" />
              </div>
              <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                Stop Camera
              </Button>
            </div>
          ) : (
            <Button onClick={startCamera} className="w-full">
              Start Camera
            </Button>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {isActive && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or enter ID manually</span>
                </div>
              </div>

              <form onSubmit={handleManualInput} className="space-y-2">
                <Label htmlFor="code">Teacher ID Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="e.g., teacher-1"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    disabled={cameraActive}
                  />
                  <Button type="submit" disabled={cameraActive || !manualInput.trim()}>
                    Submit
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Available IDs: teacher-1, teacher-2, teacher-3</p>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
