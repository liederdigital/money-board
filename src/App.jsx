import { useEffect, useMemo, useState } from "react";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTf8BB8WO_JMs3Zu4DWfXnf_hdRUXGfuDaY6tIDccf-oB0AhHhe5GgdQgcCXxKZE8q7uKaYgXcXO4Ke/pub?output=csv";

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function parseCSV(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function getItems(rows, nameCol, amountCol) {
  return rows
    .slice(1)
    .filter((row) => row[nameCol] && row[amountCol])
    .map((row) => ({
      name: row[nameCol],
      amount: Number(String(row[amountCol]).replace(/[$,]/g, "")),
    }));
}

function BoardSection({ title, total, items }) {
  return (
    <section
      style={{
        background: "#171717",
        border: "1px solid #333",
        borderRadius: 24,
        padding: 32,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 28,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          margin: "20px 0 28px",
        }}
      >
        {money(total)}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {items.map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              fontSize: 28,
              fontWeight: 600,
              borderTop: "1px solid #333",
              paddingTop: 18,
            }}
          >
            <span>{item.name}</span>
            <span>{money(item.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function loadSheet() {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const text = await response.text();

    setRows(parseCSV(text));
    setLastUpdated(new Date());
  }

  useEffect(() => {
    loadSheet();
    const interval = setInterval(loadSheet, 60000);
    return () => clearInterval(interval);
  }, []);

  const billing = useMemo(() => getItems(rows, 0, 1), [rows]);
  const sales = useMemo(() => getItems(rows, 3, 4), [rows]);

  const billingTotal = billing.reduce((sum, item) => sum + item.amount, 0);
  const salesTotal = sales.reduce((sum, item) => sum + item.amount, 0);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        padding: 40,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: 4,
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            Lieder Digital Workspace
          </div>

          <h1 style={{ fontSize: 72, margin: 0, lineHeight: 1 }}>
            Money Board
          </h1>

          <p style={{ color: "#777", fontSize: 20 }}>
            Billing, sales, and total money in motion.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 28,
          }}
        >
          <BoardSection title="Billing" total={billingTotal} items={billing} />
          <BoardSection title="Sales" total={salesTotal} items={sales} />
        </div>

        <section
          style={{
            marginTop: 28,
            background: "white",
            color: "black",
            borderRadius: 24,
            padding: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Total
          </div>

          <div style={{ fontSize: 72, fontWeight: 900 }}>
            {money(billingTotal + salesTotal)}
          </div>
        </section>

        <div style={{ color: "#555", marginTop: 24, fontSize: 14 }}>
          Updated {lastUpdated.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>
    </main>
  );
}