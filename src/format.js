// All money in this shop is Bangladeshi Taka; the shop runs on Asia/Dhaka time.
export const money = (n) =>
  `৳${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

export const PAYMENT_METHODS = ["cash", "card", "bkash", "nagad"];
export const PAYMENT_LABELS = { cash: "Cash", card: "Card", bkash: "bKash", nagad: "Nagad" };
export const paymentLabel = (m) => PAYMENT_LABELS[m] || m;
