import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { ErrorBox, Loading, PageHead, useToast } from "../components/ui.jsx";

export default function Settings() {
  const toast = useToast();
  const { data, error, reload } = useAsync(api.settings, []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);

  if (!form) return <div className="container">{error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />}</div>;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await api.saveSettings(form); await reload(); toast.success("Shop details saved"); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="container narrow">
      <PageHead title="Shop settings" subtitle="These details print at the top of every receipt" />
      <form onSubmit={submit} className="card stack pad">
        <div className="row gap" style={{ fontWeight: 600 }}><Store size={16} className="primary-text" /> Shop details</div>
        <label><span className="label">Shop name</span><input required maxLength={80} value={form.shopName} onChange={set("shopName")} /></label>
        <label><span className="label">Address</span><input maxLength={200} value={form.shopAddress} onChange={set("shopAddress")} /></label>
        <label><span className="label">Phone</span><input maxLength={40} value={form.shopPhone} onChange={set("shopPhone")} /></label>
        <label><span className="label">Receipt footer note</span>
          <input maxLength={200} value={form.receiptNote} onChange={set("receiptNote")} placeholder="e.g. No refund after 7 days" />
        </label>
        <div className="row end"><button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button></div>
      </form>
    </div>
  );
}
