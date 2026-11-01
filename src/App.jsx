import { NavLink, Link, Route, Routes } from "react-router-dom";
import { Boxes } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import Pos from "./pages/Pos.jsx";
import Sales from "./pages/Sales.jsx";
import Purchases from "./pages/Purchases.jsx";
import Products from "./pages/Products.jsx";
import { Customers, Suppliers } from "./pages/Partners.jsx";
import Receipt from "./pages/Receipt.jsx";
import Settings from "./pages/Settings.jsx";

const NAV = [
  ["/", "Dashboard", true],
  ["/pos", "New sale"],
  ["/sales", "Sales"],
  ["/purchases", "Purchases"],
  ["/products", "Products"],
  ["/customers", "Customers"],
  ["/suppliers", "Suppliers"],
  ["/settings", "Settings"],
];

function Shell({ children }) {
  return (
    <>
      <header className="topbar no-print">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-icon"><Boxes size={20} /></span>
            <span className="display">Stockroom</span>
          </Link>
          <nav className="nav">
            {NAV.map(([to, label, end]) => (
              <NavLink key={to} to={to} end={!!end} className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/receipt/:id" element={<Receipt />} />
      <Route
        path="*"
        element={
          <Shell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<Pos />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<div className="container"><p className="empty">Page not found.</p></div>} />
            </Routes>
          </Shell>
        }
      />
    </Routes>
  );
}
