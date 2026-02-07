'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, CheckCircle } from 'lucide-react';
import jsQR from "jsqr";

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Mock Teacher Database
  const TEACHER_DB: { [key: string]: TeacherData } = {
    'teacher-1': { id: 'T-1001', name: 'Dr. Smith', department: 'Chemistry' },
    'teacher-2': { id: 'T-1002', name: 'Prof. Johnson', department: 'Physics' },
    'teacher-3': { id: 'T-1003', name: 'Dr. Williams', department: 'Biology' },
    'teacher-4': { id: 'T-1004', name: 'Prof. Davis', department: 'Engineering' },
  };

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
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

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraActive(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Restart camera when facingMode changes if it was active
  useEffect(() => {
    if (cameraActive && !stream) {
      startCamera();
    }
  }, [facingMode]);


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
      // Don't show error immediately on every frame for invalid QR, just ignore or log
      console.log('Invalid QR Format:', qrValue);
    }
  };

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processQRCode(manualInput.trim().toLowerCase());
    }
  };

  // Real QR code scanning logic
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // @ts-ignore - jsQR might not have types installed
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            console.log("QR Code found:", code.data);
            processQRCode(code.data);
          }
        }
      }
    }, 500); // Scan every 500ms to save performance

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
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary opacity-30 m-12 pointer-events-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={stopCamera} variant="outline" className="flex-1 bg-transparent border-destructive text-destructive hover:bg-destructive/10">
                  Stop Camera
                </Button>
                <Button onClick={toggleCamera} variant="outline" className="flex-1">
                  Flip Camera
                </Button>
              </div>
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
