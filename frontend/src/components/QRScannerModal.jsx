import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertTriangle, Repeat } from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, onResult, title = 'QR-kodni skanerlash' }) {
  const containerId = 'peak-qr-reader';
  const scannerRef = useRef(null);
  const lastResultRef = useRef('');
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const start = async () => {
      try {
        setError('');
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!devices.length) { setError('Kamera topilmadi'); return; }
        setCameras(devices);
        // Prefer back camera if available
        const back = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
        setActiveCamera(back.id);
      } catch (e) {
        setError(e?.message || 'Kameraga ruxsat berilmadi');
      }
    };
    start();

    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeCamera) return;
    let stopped = false;
    const html5 = new Html5Qrcode(containerId, /* verbose */ false);
    scannerRef.current = html5;

    const decoded = (text) => {
      if (stopped) return;
      if (lastResultRef.current === text) return;        // dedupe rapid duplicates
      lastResultRef.current = text;
      onResult?.(text);
    };

    html5.start(activeCamera, { fps: 10, qrbox: { width: 240, height: 240 } }, decoded, () => {})
      .catch(e => setError(e?.message || 'Skanerni boshlab bo\'lmadi'));

    return () => {
      stopped = true;
      // Reset dedupe so next open isn't suppressed
      lastResultRef.current = '';
      html5.stop().then(() => html5.clear()).catch(() => {});
    };
  }, [isOpen, activeCamera, onResult]);

  const swapCamera = () => {
    const idx = cameras.findIndex(c => c.id === activeCamera);
    const next = cameras[(idx + 1) % cameras.length];
    if (next) setActiveCamera(next.id);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Camera size={17} className="text-accent" />{title}</h3>
          <div className="flex items-center gap-1">
            {cameras.length > 1 && (
              <button onClick={swapCamera} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Kamera almashtirish">
                <Repeat size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
          </div>
        </div>

        <div className="relative bg-black aspect-square">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertTriangle size={36} className="text-amber-400 mb-3" />
              <div className="font-semibold mb-1">Skaner ishlamayapti</div>
              <div className="text-sm text-slate-300">{error}</div>
            </div>
          ) : (
            <div id={containerId} className="w-full h-full" />
          )}
          {/* Scan frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-60 h-60 border-2 border-accent/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"></div>
          </div>
        </div>

        <div className="px-5 py-3 text-xs text-slate-500 text-center bg-slate-50">
          Mijozning QR-kodini ramka ichiga keltiring — avtomatik o'qiladi.
        </div>
      </div>
    </div>
  );
}
