import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { ErrorBox, IconAction, Loading, Modal, PageHead, PartnerForm, useToast } from "../components/ui.jsx";

function PartnerPage({ title, subtitle, noun, countLabel, countKey, load, create, update, remove }) {
  const toast = useToast();
  const { data, error, reload } = useAsync(load, []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (action, success) => {
    if (busy) return false;
    setBusy(true);
    try { await action(); await reload(); toast.success(success); return true; }
    catch (e) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  };

  if (!data) return <div className="container">{error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />}</div>;

  return (
    <div className="container">
      <PageHead title={title} subtitle={subtitle}>
        <button className="btn primary" onClick={() => setEditing("new")}><Plus size={16} /> Add {noun}</button>
      </PageHead>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th className="hide-sm">Address</th><th className="r">{countLabel}</th><th /></tr></thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.id}>
                <td><strong>{x.name}</strong></td>
                <td>{x.phone || "—"}</td>
                <td className="muted hide-sm">{x.address || "—"}</td>
                <td className="r num">{x[countKey]}</td>
                <td>
                  <div className="row end">
                    <IconAction label={`Edit ${x.name}`} onClick={() => setEditing(x)}><Pencil size={16} /></IconAction>
                    <IconAction label={`Delete ${x.name}`} danger onClick={() => setDeleting(x)}><Trash2 size={16} /></IconAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="empty">No {noun}s yet.</p>}
      </div>

      {editing && (
        <PartnerForm title={editing === "new" ? `Add ${noun}` : `Edit ${noun}`} busy={busy}
          initial={editing === "new" ? { name: "", phone: "", address: "" } : { name: editing.name, phone: editing.phone, address: editing.address }}
          onCancel={() => setEditing(null)}
          onSave={async (v) => {
            const ok = await run(() => (editing === "new" ? create(v) : update(editing.id, v)), `${v.name} saved`);
            if (ok) setEditing(null);
          }} />
      )}
      {deleting && (
        <Modal title={`Delete ${noun}`} onClose={() => setDeleting(null)}>
          <p className="muted">Delete <strong style={{ color: "var(--fg)" }}>{deleting.name}</strong>? Past records are kept but will no longer show a {noun}.</p>
          <div className="row end gap pt">
            <button className="btn" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn danger" disabled={busy}
              onClick={async () => { const ok = await run(() => remove(deleting.id), `${deleting.name} deleted`); if (ok) setDeleting(null); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export const Customers = () => (
  <PartnerPage title="Customers" subtitle="People you sell to" noun="customer" countLabel="Sales" countKey="salesCount"
    load={api.customers} create={api.createCustomer} update={api.updateCustomer} remove={api.deleteCustomer} />
);

export const Suppliers = () => (
  <PartnerPage title="Suppliers" subtitle="Where your stock comes from" noun="supplier" countLabel="Purchases" countKey="purchaseCount"
    load={api.suppliers} create={api.createSupplier} update={api.updateSupplier} remove={api.deleteSupplier} />
);
