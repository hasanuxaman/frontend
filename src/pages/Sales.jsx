import { useState } from "react";
import { Link } from "react-router-dom";
import { Printer, Search } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { fmtDateTime, money, paymentLabel } from "../format.js";
import { ErrorBox, Loading, Modal, PageHead } from "../components/ui.jsx";

export default function Sales() {
  const { data, error, reload } = useAsync(api.sales, []);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  if (!data) return <div className="container">{error ? <ErrorBox message={error} onRetry={reload} /> : <Loading />}</div>;

  const term = search.trim().toLowerCase();
  const rows = term
    ? data.filter((s) => s.receiptNo.toLowerCase().includes(term) || (s.customerName ?? "").toLowerCase().includes(term)
        || paymentLabel(s.paymentMethod).toLowerCase().includes(term))
    : data;

  return (
    <div className="container">
      <PageHead title="Sales" subtitle="Every sale recorded at the counter, latest first" />
      <div className="search" style={{ maxWidth: 420 }}>
        <Search size={16} />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search receipt, customer or payment" aria-label="Search sales" />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Receipt</th><th>Customer</th><th className="r hide-sm">Items</th><th>Payment</th><th className="r">Total</th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="click" onClick={() => setOpenId(s.id)}>
                <td className="muted nowrap">{fmtDateTime(s.soldAt)}</td>
                <td className="mono small">{s.receiptNo}</td>
                <td>{s.customerName ?? "Walk-in"}</td>
                <td className="r num hide-sm">{s.itemCount}</td>
                <td>{paymentLabel(s.paymentMethod)}</td>
                <td className="r num"><strong>{money(s.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">{term ? "No sales match your search." : "No sales yet — ring one up at the counter."}</p>}
      </div>
      {openId !== null && <SaleDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function SaleDetail({ id, onClose }) {
  const { data: sale } = useAsync(() => api.sale(id), [id]);
  return (
    <Modal title={sale ? `Sale ${sale.receiptNo}` : "Sale"} onClose={onClose}>
      {!sale ? <Loading /> : (
        <>
          <dl className="dl">
            <dt>Date</dt><dd>{fmtDateTime(sale.soldAt)}</dd>
            <dt>Customer</dt><dd>{sale.customerName ?? "Walk-in"}</dd>
            <dt>Payment</dt><dd>{paymentLabel(sale.paymentMethod)}</dd>
            {sale.note && (<><dt>Note</dt><dd>{sale.note}</dd></>)}
          </dl>
          <table className="plain">
            <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Total</th></tr></thead>
            <tbody>
              {sale.items.map((i) => (
                <tr key={i.id}><td>{i.name}</td><td className="r num">{i.quantity}</td><td className="r num">{money(i.unitPrice)}</td><td className="r num">{money(i.total)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <div><span>Subtotal</span><span className="num">{money(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div><span>Discount</span><span className="num">−{money(sale.discount)}</span></div>}
            <div className="grand"><span>Total</span><span className="num">{money(sale.total)}</span></div>
          </div>
          <div className="row end pt">
            <Link to={`/receipt/${sale.id}`} className="btn primary"><Printer size={16} /> Receipt</Link>
          </div>
        </>
      )}
    </Modal>
  );
}
