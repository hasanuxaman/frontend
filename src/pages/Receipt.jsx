import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { fmtDateTime, money, paymentLabel } from "../format.js";
import { ErrorBox, Loading } from "../components/ui.jsx";

export default function Receipt() {
  const { id } = useParams();
  const sale = useAsync(() => api.sale(id), [id]);
  const settings = useAsync(api.settings, []);
  if (sale.error) return <div className="container"><ErrorBox message={sale.error} onRetry={sale.reload} /></div>;
  if (!sale.data || !settings.data) return <div className="container"><Loading /></div>;
  const s = sale.data, shop = settings.data;

  return (
    <div className="receipt-page">
      <div className="receipt-wrap">
        <div className="row gap no-print" style={{ marginBottom: 16 }}>
          <Link to="/sales" className="btn"><ArrowLeft size={16} /> Sales</Link>
          <button className="btn primary grow" onClick={() => window.print()}><Printer size={16} /> Print receipt</button>
        </div>

        <div className="receipt">
          <div className="center">
            <h1 className="display" style={{ fontSize: 20, margin: 0 }}>{shop.shopName}</h1>
            {shop.shopAddress && <p className="muted small" style={{ margin: "2px 0 0" }}>{shop.shopAddress}</p>}
            {shop.shopPhone && <p className="muted small" style={{ margin: 0 }}>Tel: {shop.shopPhone}</p>}
          </div>

          <dl className="dl dashed small">
            <dt>Receipt</dt><dd className="mono">{s.receiptNo}</dd>
            <dt>Date</dt><dd>{fmtDateTime(s.soldAt)}</dd>
            <dt>Customer</dt><dd>{s.customerName ?? "Walk-in"}</dd>
            <dt>Payment</dt><dd>{paymentLabel(s.paymentMethod)}</dd>
          </dl>

          <table className="plain small">
            <thead><tr><th>Item</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Total</th></tr></thead>
            <tbody>
              {s.items.map((i) => (
                <tr key={i.id}><td>{i.name}</td><td className="r num">{i.quantity}</td><td className="r num">{money(i.unitPrice)}</td><td className="r num">{money(i.total)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="totals dashed-top small">
            <div><span className="muted">Subtotal</span><span className="num">{money(s.subtotal)}</span></div>
            {s.discount > 0 && <div><span className="muted">Discount</span><span className="num">−{money(s.discount)}</span></div>}
            <div className="grand"><span>Total</span><span className="num">{money(s.total)}</span></div>
          </div>

          {s.note && <p className="muted small">Note: {s.note}</p>}
          {shop.receiptNote && <p className="center small dashed-top" style={{ paddingTop: 12 }}>{shop.receiptNote}</p>}
          <p className="center muted small">Thank you for shopping with us!</p>
        </div>
      </div>
    </div>
  );
}
