'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface ProfessorProfile {
  id: string;
  name: string;
  department: string;
  status: 'active' | 'blocked' | 'hidden';
}

export function QRCheckinScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean;
    professor?: ProfessorProfile;
    roomNumber?: string;
    timestamp?: string;
    department?: string;
    message?: string;
  } | null>(null);

  const getProfessors = (): ProfessorProfile[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('teachers');
    return stored ? JSON.parse(stored) : [];
  };

  const findProfessor = (qrValue: string): ProfessorProfile | null => {
    const professors = getProfessors();
    return professors.find(
      p => p.id.toLowerCase() === qrValue.toLowerCase() ||
           p.name.toLowerCase() === qrValue.toLowerCase()
    ) || null;
  };

  const handleCheckin = (professor: ProfessorProfile) => {
    // Sprint 4: Check account status
    if (professor.status === 'blocked') {
      setCheckinResult({
        success: false,
        professor,
        message: 'Your account has been blocked. Please contact the administrator.'
      });
      stopCamera();
      return;
    }

    if (professor.status === 'hidden') {
      setCheckinResult({
        success: false,
        professor,
        message: 'Your account is currently inactive. Please contact the administrator.'
      });
      stopCamera();
      return;
    }

    // Get room info
    const rooms = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('labRooms') || '[]')
      : [];
    const defaultRoom = rooms.length > 0 ? rooms[0] : { number: '101', name: 'Lab' };

    const timestamp = new Date();

    // Create usage log entry
    const logEntry = {
      teacherId: professor.id,
      teacherName: professor.name,
      buildingNumber: 'IS',
      roomNumber: defaultRoom.number,
      startTime: timestamp.toISOString(),
      numStudents: 0,
      purpose: 'QR Check-in',
      equipment: [],
    };

    const existingEntries = JSON.parse(localStorage.getItem('usageEntries') || '[]');
    existingEntries.push(logEntry);
    localStorage.setItem('usageEntries', JSON.stringify(existingEntries));

    setCheckinResult({
      success: true,
      professor,
      roomNumber: defaultRoom.number,
      department: professor.department,
      timestamp: timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
    });
    stopCamera();
  };

  const startCamera = async () => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setCameraActive(true);
      setError('');
    } catch (err: any) {
      let errorMessage = 'Cannot access camera.';
      if (err.name === 'NotAllowedError') errorMessage = 'Camera permission denied.';
      else if (err.name === 'NotFoundError') errorMessage = 'No camera found.';
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  // QR scanning loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && !scanning) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              setScanning(true);
              const professor = findProfessor(code.data);
              if (professor) {
                handleCheckin(professor);
              } else {
                setError(`Professor not found: "${code.data}". Please contact the administrator.`);
                setScanning(false);
              }
            }
          }
        }
      }
    }, 300);
    return () => clearInterval(interval);
  }, [cameraActive, scanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const professor = findProfessor(manualInput.trim());
    if (professor) {
      handleCheckin(professor);
    } else {
      setError(`Professor not found with ID: "${manualInput}". Please try again.`);
    }
  };

  // ============ CHECK-IN SUCCESS SCREEN ============
  if (checkinResult?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #f0fdf4 100%)' }}
      >
        <div className="text-center space-y-6 max-w-sm mx-auto">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto animate-in zoom-in duration-500">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check-in Success!</h2>
            <p className="text-sm text-gray-500 mt-2">Thank you for using Room <span className="font-semibold text-emerald-600">Lab</span></p>
            <p className="text-3xl font-bold text-[#191970] mt-1">M{checkinResult.roomNumber}</p>
            <p className="text-sm text-gray-600 mt-1">Prof. {checkinResult.professor?.name}</p>
          </div>

          {/* Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 text-sm space-y-3 border border-emerald-100 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Timestamp</span>
              <span className="font-semibold text-gray-900">{checkinResult.timestamp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Department</span>
              <span className="font-semibold text-gray-900">{checkinResult.department}</span>
            </div>
          </div>

          {/* Complete Button */}
          <Button
            onClick={() => { setCheckinResult(null); setScanning(false); setManualInput(''); }}
            className="w-full rounded-xl py-5 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Complete & Finish
          </Button>

          <p className="text-xs text-emerald-700/50">This screen will reset automatically after 10 seconds</p>
        </div>
      </div>
    );
  }

  // ============ BLOCKED ACCOUNT SCREEN ============
  if (checkinResult && !checkinResult.success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
          <p className="text-sm text-red-600 mt-2">{checkinResult.message}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Professor</span>
            <span className="font-medium text-gray-900">{checkinResult.professor?.name}</span>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => { setCheckinResult(null); setScanning(false); setManualInput(''); }}
          className="w-full rounded-xl py-5"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // ============ SCANNER UI ============
  return (
    <div className="space-y-5">
      {error && (
        <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {cameraActive ? (
        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* QR scan guideline */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />
                {/* Scanning line animation */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-emerald-400/60 animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-white/80 text-xs bg-black/50 px-3 py-1.5 rounded-full">Scanning for QR code...</span>
            </div>
            {scanning && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <p className="text-sm font-medium">Processing...</p>
              </div>
            )}
          </div>

          <Button
            onClick={stopCamera}
            variant="outline"
            className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 py-5"
          >
            Stop Scanner
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Camera preview placeholder */}
          <div className="bg-gray-900 rounded-2xl aspect-[4/3] flex flex-col items-center justify-center">
            <Camera className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">Ready to scan your Professor ID QR Code</p>
          </div>

          <Button
            onClick={startCamera}
            className="w-full py-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base font-medium gap-2"
          >
            <Camera className="h-5 w-5" />
            Open Scanner
          </Button>

          <p className="text-center text-xs text-gray-400">
            Align the QR code on your Professor ID within the camera frame for automatic scanning
          </p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Manual ID Input */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">or enter ID manually</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <Label htmlFor="professorId" className="text-gray-700 text-sm">Professor ID</Label>
        <div className="flex gap-2">
          <Input
            id="professorId"
            placeholder="e.g., T-1001"
            value={manualInput}
            onChange={(e) => { setManualInput(e.target.value); setError(''); }}
            className="rounded-xl border-gray-200"
          />
          <Button type="submit" disabled={!manualInput.trim()} className="rounded-xl bg-[#191970] hover:bg-[#191970]/90 px-6">
            Check in
          </Button>
        </div>
      </form>
    </div>
  );
}
