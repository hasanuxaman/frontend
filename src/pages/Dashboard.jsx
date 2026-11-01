import { Link } from "react-router-dom";
import { AlertTriangle, Banknote, Package, Plus, ReceiptText, ScanBarcode, TrendingUp, Truck } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { money, fmtDateTime } from "../format.js";
import { ErrorBox, Loading, PageHead, StatCard } from "../components/ui.jsx";

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(api.dashboard, []);
  if (loading && !data) return <div className="container"><Loading /></div>;
  if (error && !data) return <div className="container"><ErrorBox message={error} onRetry={reload} /></div>;

  return (
    <div className="container">
      <PageHead title="Dashboard" subtitle="Sales, stock health and quick actions for today">
        <Link to="/pos" className="btn primary"><ScanBarcode size={16} /> New sale</Link>
        <Link to="/purchases" className="btn"><Truck size={16} /> New purchase</Link>
        <Link to="/products" className="btn"><Plus size={16} /> Add product</Link>
      </PageHead>

      <section className="grid-stats">
        <StatCard icon={<TrendingUp size={16} />} label="Sales today" value={money(data.todayTotal)} />
        <StatCard icon={<ReceiptText size={16} />} label="Orders today" value={data.todayCount} />
        <StatCard icon={<Banknote size={16} />} label="Stock value" value={money(data.stockValue)} />
        <StatCard icon={<AlertTriangle size={16} />} label="Need reorder" value={data.lowStock.length} warn={data.lowStock.length > 0} />
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Recent sales</h2><Link to="/sales" className="link">View all</Link></div>
          {data.recentSales.length === 0 ? (
            <p className="empty">No sales yet. Open the counter and ring up your first customer.</p>
          ) : (
            <ul className="list">
              {data.recentSales.map((s) => (
                <li key={s.id}>
                  <ReceiptText size={16} className="muted" />
                  <div className="grow"><span className="mono small">{s.receiptNo}</span> <span className="muted">{s.customerName ?? "Walk-in"}</span></div>
                  <time className="muted small hide-sm">{fmtDateTime(s.soldAt)}</time>
                  <strong className="num">{money(s.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Top products — last 30 days</h2><Link to="/sales" className="link">Sales</Link></div>
          {data.topProducts.length === 0 ? (
            <p className="empty">Your best sellers will appear here once sales come in.</p>
          ) : (
            <ul className="list">
              {data.topProducts.map((p, i) => (
                <li key={p.name}>
                  <span className="rank">{i + 1}</span>
                  <span className="grow truncate"><strong>{p.name}</strong></span>
                  <span className="muted small">{p.quantity} sold</span>
                  <span className="num">{money(p.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card span-2">
          <div className="card-head"><h2>Low stock — time to reorder</h2><Link to="/purchases" className="link">Record purchase</Link></div>
          {data.lowStock.length === 0 ? (
            <p className="empty">Everything is comfortably stocked.</p>
          ) : (
            <ul className="list two-col">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Package size={16} className="warn-text" />
                  <span className="grow truncate"><strong>{p.name}</strong></span>
                  <span className="muted small">reorder at {p.reorderLevel}</span>
                  <strong className="num warn-text">{p.quantity} left</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
