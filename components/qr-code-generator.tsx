'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Printer, X, Copy, CheckCircle, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface TeacherInfo {
  id: string;
  name: string;
  department: string;
}

interface QRCodeGeneratorProps {
  teacher: TeacherInfo;
  open: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ teacher, open, onClose }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && teacher) {
      generateQRCode();
    }
  }, [open, teacher]);

  const generateQRCode = async () => {
    try {
      // The QR content is the teacher ID, which is what the scanner looks for
      const qrContent = teacher.id;
      
      const dataUrl = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 2,
        color: {
          dark: '#191970',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    // Create a canvas with teacher info + QR code for a nice downloadable card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 780;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header bar
    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    headerGradient.addColorStop(0, '#191970');
    headerGradient.addColorStop(1, '#2d2d8f');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, canvas.width, 80);

    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEU Laboratory Access', canvas.width / 2, 35);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Professor QR Check-in Code', canvas.width / 2, 58);

    // QR Code image
    const img = new Image();
    img.onload = () => {
      const qrSize = 360;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 110;

      // QR border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Teacher info below QR
      const infoY = qrY + qrSize + 40;

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(teacher.name, canvas.width / 2, infoY);

      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(teacher.department, canvas.width / 2, infoY + 30);

      // ID badge
      ctx.fillStyle = '#f0f0ff';
      const badgeWidth = ctx.measureText(teacher.id).width + 30;
      const badgeX = (canvas.width - badgeWidth) / 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, infoY + 48, badgeWidth, 30, 8);
      ctx.fill();
      ctx.fillStyle = '#191970';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(teacher.id, canvas.width / 2, infoY + 68);

      // Footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px Arial, sans-serif';
      ctx.fillText('Scan this QR code at any NEU Laboratory terminal to check in', canvas.width / 2, canvas.height - 30);

      // Download
      const link = document.createElement('a');
      link.download = `QR-${teacher.name.replace(/\s+/g, '-')}-${teacher.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrDataUrl;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${teacher.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            padding: 40px;
          }
          .card {
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .header {
            background: linear-gradient(135deg, #191970, #2d2d8f);
            color: white;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .header h1 { font-size: 18px; margin-bottom: 4px; }
          .header p { font-size: 12px; opacity: 0.75; }
          .qr-img { width: 280px; height: 280px; margin: 16px auto; }
          .name { font-size: 22px; font-weight: bold; color: #111827; margin-top: 16px; }
          .dept { font-size: 14px; color: #6b7280; margin-top: 6px; }
          .id-badge {
            display: inline-block;
            background: #f0f0ff;
            color: #191970;
            padding: 6px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-weight: bold;
            font-size: 14px;
            margin-top: 12px;
          }
          .footer { font-size: 10px; color: #9ca3af; margin-top: 24px; }
          @media print {
            body { padding: 0; }
            .card { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>NEU Laboratory Access</h1>
            <p>Professor QR Check-in Code</p>
          </div>
          <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
          <div class="name">${teacher.name}</div>
          <div class="dept">${teacher.department}</div>
          <div class="id-badge">${teacher.id}</div>
          <div class="footer">Scan this QR code at any NEU Laboratory terminal to check in</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(teacher.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = teacher.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-white max-w-md p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 text-center"
          style={{ background: 'linear-gradient(135deg, #191970 0%, #2d2d8f 100%)' }}
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">QR Code Generated</DialogTitle>
          <DialogDescription className="text-blue-200/80 text-sm mt-1">
            Professor check-in code ready for use
          </DialogDescription>
        </div>

        {/* QR Code Display */}
        <div className="px-6 py-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center border border-gray-100">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${teacher.name}`}
                className="w-52 h-52 rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
                <QrCode className="h-12 w-12 text-gray-300" />
              </div>
            )}

            {/* Teacher Info */}
            <div className="text-center mt-4 space-y-1">
              <p className="text-lg font-bold text-gray-900">{teacher.name}</p>
              <p className="text-sm text-gray-500">{teacher.department}</p>
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-[#191970]/5 text-[#191970] text-xs font-mono font-bold hover:bg-[#191970]/10 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {teacher.id}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              className="py-5 rounded-xl bg-[#191970] hover:bg-[#191970]/90 text-white gap-2"
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="py-5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 gap-2"
              disabled={!qrDataUrl}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>

          <p className="text-center text-[11px] text-gray-400">
            Scan this QR code at any NEU Laboratory terminal to check in
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ======================================================
   BULK QR GENERATOR — Generate QR codes for all teachers
   ====================================================== */
export function BulkQRGenerator() {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('teachers');
    if (stored) {
      setTeachers(JSON.parse(stored).filter((t: any) => t.status === 'active'));
    }
  }, []);

  const handleBulkDownload = async () => {
    if (teachers.length === 0) return;
    setGenerating(true);
    setProgress(0);

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      try {
        const dataUrl = await QRCode.toDataURL(teacher.id, {
          width: 400,
          margin: 2,
          color: { dark: '#191970', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        });

        // Create canvas with teacher info
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = 500;
        canvas.height = 620;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        headerGradient.addColorStop(0, '#191970');
        headerGradient.addColorStop(1, '#2d2d8f');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, canvas.width, 60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEU Laboratory Access', canvas.width / 2, 28);
        ctx.font = '11px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText('Professor QR Check-in Code', canvas.width / 2, 46);

        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, (canvas.width - 320) / 2, 80, 320, 320);

            ctx.fillStyle = '#111827';
            ctx.font = 'bold 20px Arial, sans-serif';
            ctx.fillText(teacher.name, canvas.width / 2, 440);

            ctx.fillStyle = '#6b7280';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText(teacher.department, canvas.width / 2, 465);

            ctx.fillStyle = '#191970';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(teacher.id, canvas.width / 2, 500);

            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Arial, sans-serif';
            ctx.fillText('Scan at any NEU Lab terminal', canvas.width / 2, canvas.height - 20);

            const link = document.createElement('a');
            link.download = `QR-${teacher.name.replace(/\s+/g, '-')}-${teacher.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            resolve();
          };
          img.src = dataUrl;
        });
      } catch (err) {
        console.error(`Failed to generate QR for ${teacher.name}:`, err);
      }

      setProgress(Math.round(((i + 1) / teachers.length) * 100));
      // Small delay between downloads
      await new Promise(r => setTimeout(r, 500));
    }

    setGenerating(false);
  };

  return (
    <Card className="bg-gradient-to-br from-[#191970] to-[#0d0d50] text-white border-0 shadow-lg shadow-[#191970]/20">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          Bulk QR Generator
        </CardTitle>
        <CardDescription className="text-blue-200/70 text-xs">
          Download QR codes for all active professors at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/10 rounded-xl p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-100">Active professors</span>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              {teachers.length}
            </Badge>
          </div>
        </div>

        {generating && (
          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-blue-200/70 text-center">{progress}% complete</p>
          </div>
        )}

        <Button
          onClick={handleBulkDownload}
          disabled={generating || teachers.length === 0}
          className="w-full rounded-xl py-5 bg-white hover:bg-white/90 text-[#191970] font-medium gap-2"
        >
          {generating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#191970] border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {generating ? 'Generating...' : 'Download All QR Codes'}
        </Button>
      </CardContent>
    </Card>
  );
}
