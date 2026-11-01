import { useState } from "react";
import { AlertTriangle, Boxes, History, Minus, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useAsync, useDebounced } from "../hooks.js";
import { money } from "../format.js";
import { ErrorBox, FormButtons, IconAction, Loading, Modal, PageHead, StatCard, useToast } from "../components/ui.jsx";

const blank = { sku: "", name: "", category: "General", barcode: "", quantity: 0, reorderLevel: 5, unitPrice: 0 };

export default function Products() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim());
  const { data, loading, error, reload } = useAsync(() => api.inventory(search), [search]);
  const [editing, setEditing] = useState(null); // "new" | product
  const [historyFor, setHistoryFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action, success) => {
    if (busy) return false;
    setBusy(true);
    try { await action(); await reload(); toast.success(success); return true; }
    catch (e) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  };

  const adjust = (p, change) =>
    run(() => api.adjustStock(p.id, change, change > 0 ? "Stock in" : "Stock out"),
      `${change > 0 ? "Added" : "Removed"} 1 unit ${change > 0 ? "to" : "from"} ${p.name}`);

  if (!data) return <div className="container">{error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />}</div>;
  const { products, summary } = data;

  return (
    <div className="container">
      <PageHead title="Products" subtitle="Inventory, counts and movement history">
        <button className="btn primary" onClick={() => setEditing("new")}><Plus size={16} /> Add product</button>
      </PageHead>

      <section className="grid-stats">
        <StatCard icon={<Package size={16} />} label="Products" value={summary.totalProducts} />
        <StatCard icon={<Boxes size={16} />} label="Units on hand" value={summary.totalUnits.toLocaleString()} />
        <StatCard icon={<span style={{ fontWeight: 600 }}>৳</span>} label="Stock value" value={money(summary.stockValue)} />
        <StatCard icon={<AlertTriangle size={16} />} label="Need reorder" value={summary.lowStock} warn={summary.lowStock > 0} />
      </section>

      <div className="search">
        <Search size={16} />
        <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, SKU, barcode or category" aria-label="Search products" />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th><th>Product</th><th className="hide-sm">Category</th>
              <th className="r">Price</th><th className="r">In stock</th><th>Adjust</th><th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const low = p.quantity <= p.reorderLevel;
              return (
                <tr key={p.id} className={low ? "low" : ""}>
                  <td className="mono small nowrap">{p.sku}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {low && <span className="pill warn"><AlertTriangle size={12} /> Reorder</span>}
                  </td>
                  <td className="muted hide-sm">{p.category}</td>
                  <td className="r num">{money(p.unitPrice)}</td>
                  <td className="r mono">{p.quantity}</td>
                  <td>
                    <div className="stepper">
                      <button aria-label={`Remove one ${p.name}`} disabled={p.quantity === 0 || busy} onClick={() => adjust(p, -1)}><Minus size={14} /></button>
                      <button aria-label={`Add one ${p.name}`} disabled={busy} onClick={() => adjust(p, 1)}><Plus size={14} /></button>
                    </div>
                  </td>
                  <td>
                    <div className="row end">
                      <IconAction label={`History for ${p.name}`} onClick={() => setHistoryFor(p)}><History size={16} /></IconAction>
                      <IconAction label={`Edit ${p.name}`} onClick={() => setEditing(p)}><Pencil size={16} /></IconAction>
                      <IconAction label={`Delete ${p.name}`} danger onClick={() => setDeleting(p)}><Trash2 size={16} /></IconAction>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="empty">{search ? "No products match your search." : "No products yet. Add your first product to start tracking stock."}</p>
        )}
      </div>

      {editing && (
        <ProductForm product={editing === "new" ? null : editing} busy={busy} onCancel={() => setEditing(null)}
          onSave={async (values) => {
            const isNew = editing === "new";
            const ok = await run(
              () => (isNew ? api.createProduct(values) : api.updateProduct(editing.id, values)),
              isNew ? `${values.name} added` : `${values.name} updated`);
            if (ok) setEditing(null);
          }} />
      )}

      {historyFor && <HistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />}

      {deleting && (
        <Modal title="Delete product" onClose={() => setDeleting(null)}>
          <p className="muted">Delete <strong style={{ color: "var(--fg)" }}>{deleting.name}</strong> and its stock history? This cannot be undone.</p>
          <div className="row end gap pt">
            <button className="btn" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn danger" disabled={busy}
              onClick={async () => { const ok = await run(() => api.deleteProduct(deleting.id), `${deleting.name} deleted`); if (ok) setDeleting(null); }}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductForm({ product, busy, onSave, onCancel }) {
  const isNew = !product;
  const [form, setForm] = useState(product ? { ...blank, ...product, barcode: product.barcode ?? "" } : { ...blank });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave({
      sku: form.sku.trim(), name: form.name.trim(), category: form.category.trim() || "General",
      barcode: form.barcode.trim() || null,
      quantity: isNew ? Number(form.quantity) || 0 : 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      unitPrice: Number(form.unitPrice) || 0,
    });
  };
  return (
    <Modal title={isNew ? "Add product" : "Edit product"} onClose={onCancel}>
      <form className="stack" onSubmit={submit}>
        <div className="grid-2 tight">
          <label><span className="label">SKU</span><input required maxLength={40} value={form.sku} onChange={set("sku")} /></label>
          <label><span className="label">Barcode</span><input maxLength={60} value={form.barcode} onChange={set("barcode")} placeholder="optional" /></label>
          <label className="span-2"><span className="label">Name</span><input required maxLength={120} value={form.name} onChange={set("name")} /></label>
          <label className="span-2"><span className="label">Category</span><input maxLength={60} value={form.category} onChange={set("category")} /></label>
        </div>
        <div className="grid-3">
          {isNew && <label><span className="label">Starting qty</span><input type="number" min={0} value={form.quantity} onChange={set("quantity")} /></label>}
          <label><span className="label">Reorder at</span><input type="number" min={0} value={form.reorderLevel} onChange={set("reorderLevel")} /></label>
          <label><span className="label">Unit price ৳</span><input type="number" min={0} step={0.01} value={form.unitPrice} onChange={set("unitPrice")} /></label>
        </div>
        <FormButtons busy={busy} onCancel={onCancel} label={isNew ? "Add product" : "Save changes"} />
      </form>
    </Modal>
  );
}

function HistoryModal({ product, onClose }) {
  const { data, loading } = useAsync(() => api.movements(product.id), [product.id]);
  return (
    <Modal title={`Stock history: ${product.name}`} onClose={onClose}>
      {loading && !data ? <Loading /> : !data || data.length === 0 ? (
        <p className="empty">No movements recorded.</p>
      ) : (
        <ul className="list scroll">
          {data.map((m) => (
            <li key={m.id}>
              <span className={"delta " + (m.change > 0 ? "pos" : "neg")}>{m.change > 0 ? "+" : ""}{m.change}</span>
              <span className="grow">{m.reason}</span>
              <time className="muted small">{new Date(m.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
