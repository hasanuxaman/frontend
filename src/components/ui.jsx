import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

// ---------- Toasts ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const toast = useCallback(Object.assign((m) => push(m, "success"), {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
  }), [push]);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-stack no-print" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Layout bits ----------
export function PageHead({ title, subtitle, children }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="display">{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="row gap">{children}</div>}
    </header>
  );
}

export function StatCard({ icon, label, value, warn }) {
  return (
    <div className={"stat" + (warn ? " warn" : "")}>
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value display">{value}</div>
    </div>
  );
}

export function IconAction({ label, onClick, danger, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={"icon-btn" + (danger ? " danger" : "")}>
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={"modal" + (wide ? " wide" : "")}>
        <div className="modal-head">
          <h2 className="display">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormButtons({ busy, onCancel, label }) {
  return (
    <div className="row end gap pt">
      <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      <button type="submit" className="btn primary" disabled={busy}>{label}</button>
    </div>
  );
}

export function Loading() { return <p className="empty">Loading…</p>; }
export function ErrorBox({ message, onRetry }) {
  return (
    <div className="empty">
      <p>{message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}

// ---------- Partner (customer / supplier) form ----------
export function PartnerForm({ title, initial, busy, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title={title} onClose={onCancel}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <label><span className="label">Name</span><input required maxLength={120} value={form.name} onChange={set("name")} /></label>
        <label><span className="label">Phone</span><input maxLength={40} value={form.phone} onChange={set("phone")} /></label>
        <label><span className="label">Address</span><input maxLength={200} value={form.address} onChange={set("address")} /></label>
        <FormButtons busy={busy} onCancel={onCancel} label="Save" />
      </form>
    </Modal>
  );
}
