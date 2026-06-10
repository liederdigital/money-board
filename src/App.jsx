import { useEffect, useMemo, useState } from "react";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTf8BB8WO_JMs3Zu4DWfXnf_hdRUXGfuDaY6tIDccf-oB0AhHhe5GgdQgcCXxKZE8q7uKaYgXcXO4Ke/pub?output=csv";
const SECTION_TITLES = ["Billing", "Sales"];

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function parseCSV(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some(Boolean));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function parseAmount(value) {
  const amount = Number(String(value || "").replace(/[$,]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function getSectionItems(rows, title) {
  const titleRowIndex = rows.findIndex((row) =>
    row.some((cell) => normalize(cell) === normalize(title))
  );

  if (titleRowIndex === -1) {
    return [];
  }

  const titleRow = rows[titleRowIndex];
  const sectionStart = titleRow.findIndex(
    (cell) => normalize(cell) === normalize(title)
  );
  const followingSectionStarts = SECTION_TITLES.filter(
    (sectionTitle) => normalize(sectionTitle) !== normalize(title)
  )
    .map((sectionTitle) =>
      titleRow.findIndex((cell) => normalize(cell) === normalize(sectionTitle))
    )
    .filter((index) => index > sectionStart);
  const sectionEnd = followingSectionStarts.length
    ? Math.min(...followingSectionStarts)
    : Infinity;

  const headerRowIndex = rows.findIndex((row, rowIndex) => {
    if (rowIndex <= titleRowIndex) {
      return false;
    }

    const clientIndex = row.findIndex(
      (cell, cellIndex) =>
        cellIndex >= sectionStart &&
        cellIndex < sectionEnd &&
        normalize(cell) === "client"
    );
    const amountIndex = row.findIndex(
      (cell, cellIndex) =>
        cellIndex >= sectionStart &&
        cellIndex < sectionEnd &&
        normalize(cell) === "amount"
    );

    return clientIndex !== -1 && amountIndex !== -1;
  });

  if (headerRowIndex === -1) {
    return [];
  }

  const headerRow = rows[headerRowIndex];
  const nameCol = headerRow.findIndex(
    (cell, cellIndex) =>
      cellIndex >= sectionStart &&
      cellIndex < sectionEnd &&
      normalize(cell) === "client"
  );
  const amountCol = headerRow.findIndex(
    (cell, cellIndex) =>
      cellIndex >= sectionStart &&
      cellIndex < sectionEnd &&
      normalize(cell) === "amount"
  );

  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => {
      const name = normalize(row[nameCol]);
      return name && name !== "total(s)" && row[amountCol];
    })
    .map((row, index) => ({
      key: `${title}-${headerRowIndex + index + 1}-${row[nameCol]}-${row[amountCol]}`,
      name: row[nameCol],
      amount: parseAmount(row[amountCol]),
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
          color: "white",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          margin: "20px 0 28px",
        }}
      >
        {money(total)}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {items.map((item) => (
          <div
            key={item.key}
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

  async function fetchSheetRows() {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    const text = await response.text();

    return {
      rows: parseCSV(text),
      lastUpdated: new Date(),
    };
  }

  useEffect(() => {
    let isMounted = true;

    function loadSheet() {
      fetchSheetRows()
        .then(({ rows: nextRows, lastUpdated: nextLastUpdated }) => {
          if (!isMounted) {
            return;
          }

          setRows(nextRows);
          setLastUpdated(nextLastUpdated);
        })
        .catch((error) => {
          console.error("Unable to load sheet", error);
        });
    }

    loadSheet();
    const interval = setInterval(loadSheet, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const billing = useMemo(() => getSectionItems(rows, "Billing"), [rows]);
  const sales = useMemo(() => getSectionItems(rows, "Sales"), [rows]);

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
            Billing, sales, and total money in motion.
          </div>

          <h1 style={{ fontSize: 42, margin: 0, lineHeight: 1, color: "white" }}>
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

          <div style={{ fontSize: 56, fontWeight: 900 }}>
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
