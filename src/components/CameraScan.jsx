import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useToast } from "./ui.jsx";

// Camera barcode scanning via the browser BarcodeDetector API (Chrome/Edge/Android).
export default function CameraScan({ onDetect, onClose }) {
  const videoRef = useRef(null);
  const toast = useToast();
  const cbs = useRef({ onDetect, onClose });
  cbs.current = { onDetect, onClose };

  useEffect(() => {
    let cancelled = false, timer, stream;
    (async () => {
      const Detector = window.BarcodeDetector;
      if (!Detector) {
        toast.error("Camera scanning isn't supported in this browser. Use a USB scanner with the scan box instead.");
        return cbs.current.onClose();
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        toast.error("Could not open the camera.");
        return cbs.current.onClose();
      }
      if (cancelled) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      if (video) { video.srcObject = stream; try { await video.play(); } catch { /* ignore */ } }
      const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"] });
      const tick = async () => {
        if (cancelled || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length && codes[0].rawValue) return cbs.current.onDetect(codes[0].rawValue);
        } catch { /* frame not ready */ }
        timer = setTimeout(tick, 350);
      };
      tick();
    })();
    return () => { cancelled = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 className="display" style={{ fontSize: 15 }}>Point the camera at a barcode</h2>
          <button type="button" aria-label="Close camera" onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        <video ref={videoRef} className="video" muted playsInline autoPlay />
      </div>
    </div>
  );
}
