import { useState } from "react";
import { Plus, X } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { fmtDateTime, money } from "../format.js";
import { ErrorBox, Loading, Modal, PageHead, useToast } from "../components/ui.jsx";

export default function Purchases() {
  const toast = useToast();
  const list = useAsync(api.purchases, []);
  const inv = useAsync(() => api.inventory(""), []);
  const sup = useAsync(api.suppliers, []);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (values) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.createPurchase(values);
      await Promise.all([list.reload(), inv.reload()]);
      toast.success("Purchase recorded — stock updated");
      setCreating(false);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (!list.data) return <div className="container">{list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : <Loading />}</div>;
  const purchases = list.data;

  return (
    <div className="container">
      <PageHead title="Purchases" subtitle="Stock coming in from suppliers, latest first">
        <button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} /> New purchase</button>
      </PageHead>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Invoice</th><th>Supplier</th><th className="r hide-sm">Items</th><th className="r">Total</th></tr></thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="click" onClick={() => setOpenId(p.id)}>
                <td className="muted nowrap">{fmtDateTime(p.purchasedAt)}</td>
                <td className="mono small">{p.invoiceNo || "—"}</td>
                <td>{p.supplierName ?? "—"}</td>
                <td className="r num hide-sm">{p.itemCount}</td>
                <td className="r num"><strong>{money(p.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && <p className="empty">No purchases yet. Record one to bring stock in.</p>}
      </div>

      {creating && (
        <NewPurchase suppliers={sup.data ?? []} products={inv.data?.products ?? []} busy={busy}
          onClose={() => setCreating(false)} onSave={save} />
      )}
      {openId !== null && <PurchaseDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function NewPurchase({ suppliers, products, busy, onClose, onSave }) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{ productId: "", quantity: "1", unitCost: "0" }]);

  const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitCost) || 0), 0);
  const setRow = (i, patch) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const pick = (i, productId) => {
    const p = products.find((x) => String(x.id) === productId);
    setRow(i, { productId, unitCost: p ? String(p.unitPrice) : "0" });
  };

  const submit = () => {
    const items = rows.filter((r) => r.productId).map((r) => ({
      productId: Number(r.productId), quantity: Number(r.quantity) || 1, unitCost: Number(r.unitCost) || 0,
    }));
    if (!items.length) return toast.error("Add at least one item to the purchase.");
    onSave({ supplierId: supplierId ? Number(supplierId) : null, invoiceNo: invoiceNo.trim(), note: note.trim(), items });
  };

  return (
    <Modal title="New purchase" onClose={onClose} wide>
      <div className="stack">
        <div className="grid-2 tight">
          <label><span className="label">Supplier</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">No supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label><span className="label">Invoice no.</span>
            <input maxLength={60} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. INV-2041" />
          </label>
        </div>

        <div className="stack tight">
          <span className="label">Items</span>
          {rows.map((r, i) => (
            <div key={i} className="row gap">
              <select value={r.productId} onChange={(e) => pick(i, e.target.value)} aria-label="Product" className="grow">
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <input type="number" min={1} value={r.quantity} onChange={(e) => setRow(i, { quantity: e.target.value })} aria-label="Quantity" style={{ width: 80 }} />
              <input type="number" min={0} step={0.01} value={r.unitCost} onChange={(e) => setRow(i, { unitCost: e.target.value })} aria-label="Unit cost" style={{ width: 110 }} />
              <button type="button" className="icon-btn danger" aria-label="Remove item" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}><X size={16} /></button>
            </div>
          ))}
          <button type="button" className="link" style={{ alignSelf: "flex-start" }}
            onClick={() => setRows((prev) => [...prev, { productId: "", quantity: "1", unitCost: "0" }])}>+ Add item</button>
        </div>

        <label><span className="label">Note</span><input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></label>

        <div className="row between totalrow">
          <span style={{ fontWeight: 500 }}>Purchase total</span>
          <span className="display" style={{ fontSize: 20, fontWeight: 600 }}>{money(total)}</span>
        </div>
        <div className="row end gap">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Record purchase"}</button>
        </div>
      </div>
    </Modal>
  );
}

function PurchaseDetail({ id, onClose }) {
  const { data: p } = useAsync(() => api.purchase(id), [id]);
  return (
    <Modal title="Purchase" onClose={onClose}>
      {!p ? <Loading /> : (
        <>
          <dl className="dl">
            <dt>Date</dt><dd>{fmtDateTime(p.purchasedAt)}</dd>
            <dt>Invoice</dt><dd className="mono small">{p.invoiceNo || "—"}</dd>
            <dt>Supplier</dt><dd>{p.supplierName ?? "—"}</dd>
            {p.note && (<><dt>Note</dt><dd>{p.note}</dd></>)}
          </dl>
          <table className="plain">
            <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Cost</th><th className="r">Total</th></tr></thead>
            <tbody>
              {p.items.map((i) => (
                <tr key={i.id}><td>{i.name}</td><td className="r num">{i.quantity}</td><td className="r num">{money(i.unitCost)}</td><td className="r num">{money(i.total)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="totals"><div className="grand"><span>Total</span><span className="num">{money(p.total)}</span></div></div>
        </>
      )}
    </Modal>
  );
}
