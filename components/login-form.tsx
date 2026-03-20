'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, QrCode, Mail, Shield, GraduationCap, ArrowLeft, Camera, LogIn, User } from 'lucide-react';
import { QRCheckinScanner } from '@/components/qr-checkin-scanner';

export function LoginForm() {
  const { loginWithGoogle, loginLocal, user, error: authError, isLocalMode } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'admin' | 'professor'>('select');
  const [professorTab, setProfessorTab] = useState<'qr' | 'google'>('qr');

  // Local login form state
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleLogin = async (role: 'admin' | 'professor') => {
    try {
      setLoading(true);
      await loginWithGoogle(role);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const handleLocalLogin = (role: 'admin' | 'professor') => {
    if (!localName.trim()) return;
    loginLocal(localName.trim(), localEmail.trim(), role);
  };

  // ============ LANDING PAGE ============
  if (mode === 'select') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0a2e 0%, #0d1147 30%, #111b6b 60%, #0a0a2e 100%)',
        }}
      >
        {/* Gradient orbs */}
        <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center space-y-8 px-4 max-w-xl mx-auto">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)' }}>
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">NEU Laboratory</h1>
            <p className="text-gray-400 text-sm">Smart Usage Log & Access Control</p>
            {isLocalMode && (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 text-xs font-medium">Local Mode — Supabase not configured</span>
              </div>
            )}
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {/* Professor Access */}
            <button
              onClick={() => setMode('professor')}
              className="group relative rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] rounded-tr-2xl"
                style={{ background: 'linear-gradient(225deg, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(16,185,129,0.15)' }}>
                <QrCode className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Professor Access</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Scan QR or Log via Google</p>
            </button>

            {/* Admin Portal */}
            <button
              onClick={() => setMode('admin')}
              className="group relative rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.03] cursor-pointer border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[40px] rounded-tr-2xl"
                style={{ background: 'linear-gradient(225deg, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Shield className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Admin Portal</h3>
              <p className="text-xs text-gray-400 leading-relaxed">System Management & Analytics</p>
            </button>
          </div>

          {authError && (
            <div className="flex gap-2 rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-200 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <p className="text-xs text-gray-500 pt-4">© 2024 New Era University. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // ============ ADMIN LOGIN ============
  if (mode === 'admin') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(160deg, #0a0a2e 0%, #0d1147 30%, #111b6b 60%, #0a0a2e 100%)' }}
      >
        <div className="w-full max-w-md space-y-6">
          <button
            onClick={() => setMode('select')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
            <div className="text-center pt-8 pb-4 px-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Portal</h2>
              <p className="text-gray-500 text-sm mt-1">
                {isLocalMode ? 'Enter your name to sign in locally' : 'Sign in with your institutional Google account'}
              </p>
            </div>

            <div className="px-6 pb-8 space-y-4">
              {authError && (
                <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {isLocalMode ? (
                /* Local Login Form */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name" className="text-gray-700 text-sm">Your Name</Label>
                    <Input
                      id="admin-name"
                      placeholder="e.g., Admin User"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="rounded-xl border-gray-200 py-5"
                      onKeyDown={(e) => e.key === 'Enter' && handleLocalLogin('admin')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email" className="text-gray-700 text-sm">Email (optional)</Label>
                    <Input
                      id="admin-email"
                      placeholder="e.g., admin@neu.edu.ph"
                      value={localEmail}
                      onChange={(e) => setLocalEmail(e.target.value)}
                      className="rounded-xl border-gray-200 py-5"
                      onKeyDown={(e) => e.key === 'Enter' && handleLocalLogin('admin')}
                    />
                  </div>
                  <Button
                    className="w-full py-6 flex gap-3 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 transition-all"
                    onClick={() => handleLocalLogin('admin')}
                    disabled={!localName.trim()}
                  >
                    <LogIn className="h-5 w-5" />
                    Sign in as Admin
                  </Button>
                </div>
              ) : (
                /* Google Login */
                <Button
                  className="w-full py-6 flex gap-3 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 transition-all"
                  onClick={() => handleGoogleLogin('admin')}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Sign in with Google
                </Button>
              )}

              <p className="text-center text-xs text-gray-400">
                {isLocalMode
                  ? 'Running in local mode — no Supabase connection'
                  : 'Only authorized admin accounts can access this portal'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ PROFESSOR CHECK-IN ============
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 pt-8 pb-12"
      style={{ background: '#f5f7fa' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Back link */}
        <button
          onClick={() => { setMode('select'); setProfessorTab('qr'); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Check-in</span>
        </button>

        {/* Tab toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-gray-100 p-1 border border-gray-200">
            <button
              onClick={() => setProfessorTab('qr')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                professorTab === 'qr'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              QR Scan
            </button>
            <button
              onClick={() => setProfessorTab('google')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                professorTab === 'google'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isLocalMode ? 'Local Login' : 'Google Login'}
            </button>
          </div>
        </div>

        {/* QR Scan Tab */}
        {professorTab === 'qr' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <QRCheckinScanner />
            </div>
          </div>
        )}

        {/* Google/Local Login Tab */}
        {professorTab === 'google' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 overflow-hidden">
            <div className="px-6 py-8 space-y-6">
              {/* Icon + Info */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  {isLocalMode ? <User className="h-7 w-7 text-blue-500" /> : <Mail className="h-7 w-7 text-blue-500" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isLocalMode ? 'Local Sign In' : 'Institutional Email'}
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  {isLocalMode
                    ? 'Enter your name to sign in as a professor'
                    : 'Sign in with your @neu.edu.ph Google account to record usage'}
                </p>
              </div>

              {authError && (
                <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {isLocalMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prof-name" className="text-gray-700 text-sm">Your Name</Label>
                    <Input
                      id="prof-name"
                      placeholder="e.g., Prof. Cruz"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="rounded-xl border-gray-200 py-5"
                      onKeyDown={(e) => e.key === 'Enter' && handleLocalLogin('professor')}
                    />
                  </div>
                  <Button
                    className="w-full py-6 flex gap-3 rounded-xl text-base font-medium bg-[#191970] hover:bg-[#191970]/90 transition-all"
                    onClick={() => handleLocalLogin('professor')}
                    disabled={!localName.trim()}
                  >
                    <LogIn className="h-5 w-5" />
                    Sign in as Professor
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full py-6 flex gap-3 rounded-xl text-base font-medium bg-[#191970] hover:bg-[#191970]/90 transition-all"
                  onClick={() => handleGoogleLogin('professor')}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Sign in with Google
                </Button>
              )}

              <p className="text-center text-xs text-gray-400">
                {isLocalMode
                  ? 'Running in local mode — no external services required'
                  : 'Restricted to @neu.edu.ph accounts only'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
