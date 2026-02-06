'use client';

import React from "react"

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, CheckCircle } from 'lucide-react';

interface RoomData {
  roomId: string;
  roomNumber: string;
  roomName: string;
}

interface ScanResult {
  room: RoomData;
  scannedAt: Date;
}

interface QRScannerProps {
  onScan: (room: RoomData) => void;
  isActive: boolean;
}

export function QRScanner({ onScan, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock QR code database - in production this would be from an API
  const QR_CODES: { [key: string]: RoomData } = {
    'room-101': { roomId: 'room-101', roomNumber: '101', roomName: 'Advanced Chemistry Lab' },
    'room-102': { roomId: 'room-102', roomNumber: '102', roomName: 'Physics Lab' },
    'room-103': { roomId: 'room-103', roomNumber: '103', roomName: 'Biology Lab' },
    'room-104': { roomId: 'room-104', roomNumber: '104', roomName: 'Materials Lab' },
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError('Cannot access camera. Try using manual code entry instead.');
      console.error('[v0] Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const processQRCode = (qrValue: string) => {
    const room = QR_CODES[qrValue];
    if (room) {
      onScan(room);
      setSuccess(`Scanned: ${room.roomName}`);
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      setManualInput('');
    } else {
      setError(`Invalid QR code: ${qrValue}`);
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

      // Simulate QR detection - in production use jsQR or similar library
      // For demo: detect text patterns in the canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // This is a simplified mock - real implementation would use QR decoding library
    }, 100);

    return () => clearInterval(interval);
  }, [cameraActive]);

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>Scan the QR code on the lab room door</CardDescription>
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

          {cameraActive ? (
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">or enter code manually</span>
            </div>
          </div>

          <form onSubmit={handleManualInput} className="space-y-2">
            <Label htmlFor="code">Room Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="e.g., room-101"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={cameraActive}
              />
              <Button type="submit" disabled={cameraActive || !manualInput.trim()}>
                Submit
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Available codes: room-101, room-102, room-103, room-104</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
