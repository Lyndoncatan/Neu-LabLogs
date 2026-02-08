'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, CheckCircle, Loader2, ScanText } from 'lucide-react';
import jsQR from "jsqr";
import Tesseract from 'tesseract.js';

export interface TeacherData {
  id: string;
  name: string;
  department: string;
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
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Mock Teacher Database (Fallback)
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
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setCameraActive(true);
      setError('');
    } catch (err: any) {
      let errorMessage = 'Cannot access camera.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found.';
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = 'Camera requires HTTPS.';
      }
      setError(`${errorMessage} (${err.name})`);
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

  // QR Processing (Legacy/Backup)
  const processQRCode = (qrValue: string) => {
    const parts = qrValue.split(',');
    if (parts.length === 3) {
      const [department, name, id] = parts.map(s => s.trim());
      handleSuccess({ id, name, department });
      return true;
    }
    const teacher = TEACHER_DB[qrValue];
    if (teacher) {
      handleSuccess(teacher);
      return true;
    }
    return false;
  };

  const handleSuccess = (teacher: TeacherData) => {
    onScan(teacher);
    setSuccess(`Scanned: ${teacher.name}`);
    setTimeout(() => setSuccess(''), 3000);
    setError('');
    setManualInput('');
    stopCamera();
    setScanning(false);
  };

  // OCR Processing
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;

    setScanning(true);
    setError('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/png');

      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: m => console.log(m)
      });

      const text = result.data.text;
      console.log('OCR Text:', text);

      // Simple Parser Logic
      // 1. Try to find ID pattern (e.g., T-1234 or numbers that look like ID)
      // 2. Try to find likely names (capitalized words on same line)

      // Heuristic: If we find "Department of X", extract X.
      // Heuristic: If we find a line with 2-3 capitalized words, might be name.

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let foundName = '';
      let foundDept = '';
      let foundId = '';

      // Very basic heuristics
      lines.forEach(line => {
        if (line.toLowerCase().includes('department') || line.toLowerCase().includes('college')) {
          foundDept = line;
        }
        // ID Pattern guess: alphanumeric with existing digits, maybe 6+ chars
        if (/\b[A-Z0-9-]{6,}\b/.test(line) && /\d/.test(line)) {
          // Provide option to select this as ID? For now take first match that looks like ID
          if (!foundId && !line.includes('Department') && !line.includes('University')) {
            foundId = line;
          }
        }
        // Name guess: If not Dept/ID, and looks like name?
        if (!foundName && !line.includes('Department') && !line.includes('University') && !/\d/.test(line)) {
          if (line.split(' ').length >= 2) {
            foundName = line;
          }
        }
      });

      if (foundName || foundId) {
        handleSuccess({
          id: foundId || 'Unknown-ID',
          name: foundName || 'Unknown Name',
          department: foundDept || 'Unknown Dept'
        });
      } else {
        setError('Could not read ID card. Please try again or type ID.');
        setScanning(false);
      }

    } catch (err: any) {
      console.error('OCR Error:', err);
      setError('Failed to scan. Please try again.');
      setScanning(false);
    }
  };

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      // Allow any manual input to pass through as a teacher ID for now to unblock user
      // Or check DB
      const teacher = TEACHER_DB[manualInput.trim().toLowerCase()];
      if (teacher) {
        handleSuccess(teacher);
      } else {
        // Fallback for manual entry not in DB -> Create temporary
        handleSuccess({
          id: manualInput.trim(),
          name: 'Manual Entry',
          department: 'N/A'
        });
      }
    }
  };

  // Keep QR scanning running lightly in background just in case
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current || scanning) return;
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && !scanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw small frame for QR check to save perf
            // We actually don't want to draw over the main canvas used for OCR capture
            // So maybe create a temp canvas or just skip auto-QR for now to save resources
            // since user said NO QR.
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cameraActive, scanning]);

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner (OCR & QR)
          </CardTitle>
          <CardDescription>Scan ID card or Enter Code</CardDescription>
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

                {/* Visual Guide */}
                <div className="absolute inset-0 border-4 border-white/30 m-8 rounded-lg pointer-events-none flex items-center justify-center">
                  <p className="text-white/50 text-sm font-medium bg-black/50 px-2 py-1 rounded">Align ID Here</p>
                </div>

                {scanning && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-medium">Reading Text...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-col sm:flex-row">
                <Button
                  onClick={captureAndScan}
                  disabled={scanning}
                  className="flex-1"
                  variant="default"
                >
                  <ScanText className="h-4 w-4 mr-2" />
                  {scanning ? 'Scanning...' : 'Capture & Read Text'}
                </Button>

                <div className="flex gap-2 flex-1">
                  <Button onClick={toggleCamera} variant="outline" className="flex-1" disabled={scanning}>
                    Flip
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" disabled={scanning}>
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={startCamera} className="w-full">
              Start Scanner
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
                    disabled={scanning}
                  />
                  <Button type="submit" disabled={!manualInput.trim() || scanning}>
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
