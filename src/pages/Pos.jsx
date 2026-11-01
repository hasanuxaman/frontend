import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Minus, Plus, ScanBarcode, Search, ShoppingCart, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { useAsync } from "../hooks.js";
import { money, PAYMENT_LABELS, PAYMENT_METHODS } from "../format.js";
import CameraScan from "../components/CameraScan.jsx";
import { ErrorBox, Loading, useToast } from "../components/ui.jsx";

export default function Pos() {
  const toast = useToast();
  const navigate = useNavigate();
  const inv = useAsync(() => api.inventory(""), []);
  const cust = useAsync(api.customers, []);
  const products = inv.data?.products ?? [];
  const customers = cust.data ?? [];

  const [cart, setCart] = useState([]); // { product, qty }
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState("cash");
  const [customerId, setCustomerId] = useState("");
  const [scan, setScan] = useState("");
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const scanRef = useRef(null);

  const findByCode = useCallback((code) => {
    const v = code.trim().toLowerCase();
    if (!v) return null;
    return products.find((p) => p.sku.toLowerCase() === v || (p.barcode && p.barcode.toLowerCase() === v)) ?? null;
  }, [products]);

  const add = useCallback((product) => {
    if (product.quantity <= 0) return toast.error(`${product.name} is out of stock.`);
    setCart((prev) => {
      const line = prev.find((l) => l.product.id === product.id);
      if (line) {
        if (line.qty >= product.quantity) { toast.error(`Only ${product.quantity} of ${product.name} in stock.`); return prev; }
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
  }, [toast]);

  const handleCode = useCallback((code) => {
    const found = findByCode(code);
    if (found) { add(found); toast.success(`${found.name} added`); }
    else toast.error(`No product matches code "${code.trim()}"`);
    setCamera(false);
  }, [findByCode, add, toast]);

  const onScanInput = (value) => {
    setScan(value);
    const exact = findByCode(value); // a USB scanner types the full code instantly
    if (exact) { add(exact); setScan(""); scanRef.current?.focus(); }
  };
  const onScanEnter = () => {
    const found = findByCode(scan);
    if (found) { add(found); toast.success(`${found.name} added`); }
    setScan(""); scanRef.current?.focus();
  };

  const setQty = (id, qty) =>
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.product.id !== id) : prev.map((l) => (l.product.id === id ? { ...l, qty } : l))));

  const subtotal = cart.reduce((s, l) => s + l.product.unitPrice * l.qty, 0);
  const discountNum = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountNum;

  const term = scan.trim().toLowerCase();
  const visible = term
    ? products.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
        || p.category.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term))).slice(0, 12)
    : products.slice(0, 24);

  const complete = async () => {
    if (!cart.length || busy) return;
    setBusy(true);
    try {
      const res = await api.createSale({
        customerId: customerId ? Number(customerId) : null,
        discount: discountNum,
        paymentMethod: payment,
        note: "",
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      });
      toast.success(`Sale ${res.receiptNo} completed`);
      navigate(`/receipt/${res.id}`);
    } catch (e) {
      toast.error(e.message);
      inv.reload(); // stock may have changed
    } finally { setBusy(false); }
  };

  if (!inv.data) return <div className="container">{inv.error ? <ErrorBox message={inv.error} onRetry={inv.reload} /> : <Loading />}</div>;

  return (
    <div className="container">
      <div className="pos">
        <section>
          <div className="row gap">
            <div className="search grow" style={{ margin: 0 }}>
              <Search size={16} />
              <input ref={scanRef} autoFocus type="search" value={scan} onChange={(e) => onScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onScanEnter()} placeholder="Scan barcode or search products…" aria-label="Scan or search products" />
            </div>
            <button type="button" className="btn square" onClick={() => setCamera(true)} aria-label="Scan with camera" title="Scan with camera"><Camera size={20} /></button>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>Keep this box focused — a USB barcode scanner types the code and the item jumps into the cart.</p>

          <div className="tiles">
            {visible.map((p) => {
              const low = p.quantity <= p.reorderLevel;
              return (
                <button key={p.id} type="button" className="tile" onClick={() => add(p)} disabled={p.quantity <= 0}>
                  <span className="tile-name">{p.name}</span>
                  <span className="mono muted tiny">{p.sku}</span>
                  <div className="row between" style={{ marginTop: 8 }}>
                    <span className="num">{money(p.unitPrice)}</span>
                    <span className={"pill " + (p.quantity <= 0 ? "bad" : low ? "warn" : "")}>{p.quantity} in stock</span>
                  </div>
                </button>
              );
            })}
          </div>
          {visible.length === 0 && <p className="empty">No products match "{scan}".</p>}
        </section>

        <aside className="cart card">
          <h2 className="display row gap" style={{ fontSize: 16, margin: 0 }}><ShoppingCart size={16} /> Cart</h2>
          <label style={{ marginTop: 12 }}>
            <span className="label">Customer</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
            </select>
          </label>

          {cart.length === 0 ? (
            <p className="empty">Scan or tap a product to start the sale.</p>
          ) : (
            <ul className="list">
              {cart.map((l) => (
                <li key={l.product.id}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <p className="truncate" style={{ margin: 0, fontWeight: 500 }}>{l.product.name}</p>
                    <p className="muted small" style={{ margin: 0 }}>{money(l.product.unitPrice)} × {l.qty}</p>
                  </div>
                  <div className="stepper">
                    <button aria-label={`Reduce ${l.product.name}`} onClick={() => setQty(l.product.id, l.qty - 1)}><Minus size={12} /></button>
                    <span className="qty">{l.qty}</span>
                    <button aria-label={`Add one more ${l.product.name}`} onClick={() => add(l.product)}><Plus size={12} /></button>
                  </div>
                  <button className="icon-btn danger" aria-label={`Remove ${l.product.name}`} onClick={() => setQty(l.product.id, 0)}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid-2 tight" style={{ marginTop: 12 }}>
            <label><span className="label">Discount ৳</span><input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
            <div className="r"><span className="label">Subtotal</span><p className="display" style={{ fontSize: 20, margin: "4px 0 0" }}>{money(subtotal)}</p></div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span className="label">Payment</span>
            <div className="seg">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} type="button" className={payment === m ? "on" : ""} onClick={() => setPayment(m)}>{PAYMENT_LABELS[m]}</button>
              ))}
            </div>
          </div>

          <div className="row between totalrow">
            <span style={{ fontWeight: 500 }}>Total</span>
            <span className="display" style={{ fontSize: 24, fontWeight: 600 }}>{money(total)}</span>
          </div>
          <button type="button" className="btn primary block" onClick={complete} disabled={!cart.length || busy}>
            <ScanBarcode size={16} /> {busy ? "Saving…" : `Charge ${money(total)}`}
          </button>
        </aside>
      </div>
      {camera && <CameraScan onDetect={handleCode} onClose={() => setCamera(false)} />}
    </div>
  );
}
