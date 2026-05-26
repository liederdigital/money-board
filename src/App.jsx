import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  DollarSign,
  TrendingUp,
  FileText,
  AlertTriangle,
} from "lucide-react";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTf8BB8WO_JMs3Zu4DWfXnf_hdRUXGfuDaY6tIDccf-oB0AhHhe5GgdQgcCXxKZE8q7uKaYgXcXO4Ke/pub?output=csv";

function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).map((line) => {
    const values = [];
    let current = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"' && quoted && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  });

  const headers = rows.shift().map((h) => h.trim());

  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
  );
}

const demoRows = [
  {
    Type: "Sales",
    Name: "Paramount",
    Amount: "13000",
    Status: "Proposal",
    Stage: "Hot",
    Notes: "Follow up this week",
  },
  {
    Type: "Sales",
    Name: "Crestone",
    Amount: "3600",
    Status: "Open",
    Stage: "Warm",
    Notes: "Waiting on decision",
  },
  {
    Type: "Invoice",
    Name: "AZPC Marana",
    Amount: "5625",
    Status: "Open",
    Stage: "Due",
    Notes: "Awaiting payment",
  },
];

function MetricCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div
      style={{
        background: "#171717",
        borderRadius: 20,
        padding: 24,
        border: "1px solid #333",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              color: "#888",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              marginTop: 12,
            }}
          >
            {value}
          </div>

          <div
            style={{
              color: "#777",
              marginTop: 8,
            }}
          >
            {subtitle}
          </div>
        </div>

        <Icon size={28} color="#888" />
      </div>
    </div>
  );
}

function ItemList({ title, rows }) {
  return (
    <div
      style={{
        background: "#171717",
        borderRadius: 20,
        padding: 24,
        border: "1px solid #333",
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {rows.map((row, index) => (
        <div
          key={`${row.Name}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            padding: "14px 0",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{row.Name}</div>
            <div style={{ color: "#888", fontSize: 14 }}>
              {row.Status} · {row.Stage}
            </div>
            <div style={{ color: "#666", fontSize: 13 }}>
              {row.Notes}
            </div>
          </div>

          <div style={{ fontWeight: 700 }}>
            {money(row.Amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(demoRows);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  async function loadSheet() {
    if (
      !SHEET_CSV_URL ||
      SHEET_CSV_URL.includes("PASTE_")
    ) {
      setRows(demoRows);
      return;
    }

    const response = await fetch(SHEET_CSV_URL);
    const text = await response.text();

    setRows(parseCSV(text));
    setLastUpdated(new Date());
  }

  useEffect(() => {
    loadSheet();

    const interval = setInterval(loadSheet, 60000);

    return () => clearInterval(interval);
  }, []);

  const sales = useMemo(
    () =>
      rows.filter(
        (r) => r.Type?.toLowerCase() === "sales"
      ),
    [rows]
  );

  const invoices = useMemo(
    () =>
      rows.filter(
        (r) => r.Type?.toLowerCase() === "invoice"
      ),
    [rows]
  );

  const salesTotal = sales.reduce(
    (sum, row) => sum + Number(row.Amount || 0),
    0
  );

  const invoiceTotal = invoices.reduce(
    (sum, row) => sum + Number(row.Amount || 0),
    0
  );

  const urgent = rows.filter((r) =>
    ["due", "hot", "urgent"].includes(
      (r.Stage || "").toLowerCase()
    )
  ).length;

  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "white",
        minHeight: "100vh",
        padding: 32,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: 3,
                fontSize: 12,
              }}
            >
              Lieder Digital Workspace
            </div>

            <h1
              style={{
                fontSize: 56,
                marginTop: 10,
                marginBottom: 10,
                lineHeight: 1.1,
              }}
            >
              Money Board
            </h1>

            <div style={{ color: "#777" }}>
              Revenue, pipeline, invoices, pressure.
            </div>
          </div>

          <button
            onClick={loadSheet}
            style={{
              background: "white",
              color: "black",
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              height: 50,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <MetricCard
            title="Sales Hopper"
            value={money(salesTotal)}
            subtitle={`${sales.length} active leads`}
            icon={TrendingUp}
          />

          <MetricCard
            title="Invoices Open"
            value={money(invoiceTotal)}
            subtitle={`${invoices.length} waiting`}
            icon={FileText}
          />

          <MetricCard
            title="Total In Motion"
            value={money(salesTotal + invoiceTotal)}
            subtitle="Pipeline + billing"
            icon={DollarSign}
          />

          <MetricCard
            title="Urgent Items"
            value={urgent}
            subtitle="Hot or due"
            icon={AlertTriangle}
          />
        </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 20,
            }}
          >
            <ItemList title="Sales Leads" rows={sales} />
            <ItemList title="Awaiting Payment" rows={invoices} />
          </div>
      </div>
    </div>
  );
}