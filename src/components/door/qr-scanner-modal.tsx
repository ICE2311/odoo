'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, X, RefreshCw, Upload, Volume2, VolumeX, 
  AlertCircle, CheckCircle2, SwitchCamera, Sparkles 
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  isProcessing?: boolean;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onScan,
  isProcessing = false,
}: QrScannerModalProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanSuccessAnim, setScanSuccessAnim] = useState<boolean>(false);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanTimestamp = useRef<number>(0);
  const elementId = 'door-qr-camera-viewport';

  // Play audio chime via Web Audio API
  const playChime = useCallback((type: 'success' | 'error' = 'success') => {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio autoplay policy or browser limitation
    }
  }, [audioEnabled]);

  // Handle successful code detection
  const handleDecodedCode = useCallback((decodedText: string) => {
    const now = Date.now();
    // Prevent duplicate rapid scans within 2.5 seconds
    if (decodedText === lastScanned && now - lastScanTimestamp.current < 2500) {
      return;
    }

    lastScanTimestamp.current = now;
    setLastScanned(decodedText);
    setScanSuccessAnim(true);
    setTimeout(() => setScanSuccessAnim(false), 800);

    playChime('success');
    onScan(decodedText);
  }, [lastScanned, onScan, playChime]);

  // Safely stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      } finally {
        scannerRef.current = null;
        setCameraActive(false);
      }
    }
  }, []);

  // Initialize and start scanner
  const startScanner = useCallback(async (cameraId?: string) => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    setErrorMessage(null);

    try {
      await stopScanner();

      const { Html5Qrcode } = await import('html5-qrcode');

      // Discover camera devices
      let availableCameras: Array<{ id: string; label: string }> = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          availableCameras = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || `Camera ${idx + 1}`,
          }));
          setCameras(availableCameras);
        }
      } catch (err) {
        console.warn('Could not enumerate cameras:', err);
      }

      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      // Camera config: prefer back camera on mobile or selected device
      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : availableCameras.length > 0
        ? { deviceId: { exact: availableCameras[0].id } }
        : { facingMode: 'environment' };

      const scanConfig = {
        fps: 12,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        cameraConfig,
        scanConfig,
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        () => {
          // Frame error (no QR found in this frame), expected during scanning
        }
      );

      setCameraActive(true);
      if (cameraId) setSelectedCameraId(cameraId);
      else if (availableCameras.length > 0) setSelectedCameraId(availableCameras[0].id);
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setErrorMessage(
        err.message?.includes('Permission') || err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings, or upload a photo of the QR code.'
          : 'Could not access camera. Please ensure another app is not using it, or upload an image instead.'
      );
      setCameraActive(false);
    } finally {
      setLoading(false);
    }
  }, [handleDecodedCode, stopScanner]);

  // Handle image file upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      const { Html5Qrcode } = await import('html5-qrcode');
      
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        handleDecodedCode(decodedText);
      }
    } catch (err: any) {
      console.error('Failed to read QR from image:', err);
      setErrorMessage('Could not find a valid QR code in the uploaded image. Please try a clearer picture.');
      playChime('error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Mount/Unmount lifecycle
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM container to render
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isOpen, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                Live QR Code Scanner
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Scan attendee ticket QR code with camera</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Mute beep' : 'Enable beep'}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[360px] overflow-hidden">
          {/* html5-qrcode video target */}
          <div id={elementId} className="w-full h-full max-w-md mx-auto aspect-square" />

          {/* Laser & Target Box Overlay */}
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div 
                className={`relative w-64 h-64 border-2 rounded-2xl transition-all duration-300 ${
                  scanSuccessAnim ? 'border-emerald-500 scale-105 ring-4 ring-emerald-500/30' : 'border-primary/80 shadow-2xl ring-2 ring-primary/20'
                }`}
              >
                {/* Targeting Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Animated Laser Scanning Beam */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-bounce duration-1000 top-1/2 -translate-y-1/2" />

                {scanSuccessAnim && (
                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center animate-in zoom-in-90 duration-150">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-md animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-foreground">Starting camera...</p>
            </div>
          )}

          {/* Error Indicator */}
          {errorMessage && !loading && (
            <div className="absolute inset-0 bg-card p-6 flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <h4 className="font-bold text-foreground text-base">Camera Unavailable</h4>
              <p className="text-xs text-muted-foreground max-w-xs">{errorMessage}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => startScanner(selectedCameraId)}
                  className="rounded-xl gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload QR Image
                </Button>
              </div>
            </div>
          )}

          {/* Processing Banner */}
          {isProcessing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Verifying Ticket...
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-border bg-card space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Align QR code inside green frame to scan.
            </span>

            {/* Hidden image file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs rounded-xl font-medium shrink-0 gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </Button>
          </div>

          {/* Camera switcher if multiple cameras detected */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <SwitchCamera className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => startScanner(e.target.value)}
                className="w-full text-xs bg-muted/50 border border-border rounded-lg py-1.5 px-2.5 text-foreground focus:ring-1 focus:ring-primary"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

