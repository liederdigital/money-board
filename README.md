# Money Board

A deliberately simple digital replacement for the office whiteboards.

Live site:

https://moneyboard.dev

## Purpose

Money Board answers three questions:

1. What money am I waiting to collect?
2. What sales opportunities are in motion?
3. What is the total value of both combined?

This is intentionally **not** a CRM, accounting system, or business intelligence dashboard.

The goal is to provide a simple, glanceable scoreboard that can be viewed from any device.

---

## Architecture

Google Sheets → Money Board → Vercel → moneyboard.dev

### Data Source

The application reads data from a published Google Sheet.

Each section should be labeled `Billing` or `Sales`. Within each section, the app looks for `Client` and `Amount` columns and displays only those values.

Additional columns such as `Date`, `Notes`, or internal tracking fields are allowed. They can be used in the sheet without appearing on the public whiteboard.

### Billing

| Client | Amount |
|----------|----------|
| Tugg Line | 2500 |
| Paramount Homes | 1000 |

### Sales

| Client | Amount |
|----------|----------|
| Bugs Towing | 8350 |

The application calculates totals automatically.

---

## Normal Usage

To update Money Board:

1. Open the Google Sheet
2. Edit client names or amounts
3. Refresh moneyboard.dev

No GitHub actions are required.
No Vercel actions are required.
No deployment is required.

---

## Development Workflow

Only use GitHub when changing the application itself.

Typical workflow:

    git add .
    git commit -m "Describe change"
    git push

Vercel automatically deploys changes after each push.

---

## Deployment

Hosting: Vercel

Domain: moneyboard.dev

GitHub repository:

git@github.com:liederdigital/money-board.git

Deployment is automatic.

---

## Local Development

Start the development server:

    npm run dev

Open:

http://localhost:5173

---

## Notes

Money Board is intentionally simple.

- Remove complexity.
- Reduce clicks.
- Favor readability over features.
- Treat it like a digital whiteboard.

The goal is clarity, not analytics.
