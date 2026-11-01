const BASE = import.meta.env.VITE_API_URL;

console.log("API URL:", BASE);

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Can't reach the server. Is the API running?");
  }
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  if (!res.ok) throw new Error(data?.message || data?.title || `Request failed (${res.status})`);
  return data;
}

const get = (p) => request("GET", p);
const post = (p, b = {}) => request("POST", p, b);
const put = (p, b) => request("PUT", p, b);
const del = (p) => request("DELETE", p);

export const api = {
  dashboard: () => get("/dashboard"),
  inventory: (search = "") => get(`/products?search=${encodeURIComponent(search)}`),
  createProduct: (p) => post("/products", p),
  updateProduct: (id, p) => put(`/products/${id}`, p),
  deleteProduct: (id) => del(`/products/${id}`),
  adjustStock: (id, change, reason) => post(`/products/${id}/adjust`, { change, reason }),
  movements: (id) => get(`/products/${id}/movements`),

  customers: () => get("/customers"),
  createCustomer: (c) => post("/customers", c),
  updateCustomer: (id, c) => put(`/customers/${id}`, c),
  deleteCustomer: (id) => del(`/customers/${id}`),

  suppliers: () => get("/suppliers"),
  createSupplier: (s) => post("/suppliers", s),
  updateSupplier: (id, s) => put(`/suppliers/${id}`, s),
  deleteSupplier: (id) => del(`/suppliers/${id}`),

  sales: () => get("/sales"),
  sale: (id) => get(`/sales/${id}`),
  createSale: (s) => post("/sales", s),

  purchases: () => get("/purchases"),
  purchase: (id) => get(`/purchases/${id}`),
  createPurchase: (p) => post("/purchases", p),

  settings: () => get("/settings"),
  saveSettings: (s) => put("/settings", s),
};
