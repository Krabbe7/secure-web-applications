const express = require("express");
const path = require("path");
const crypto = require("crypto"); // Bruges til at generere nonce

const app = express();
const port = 3000;

app.use(express.json({ type: ["application/json", "application/csp-report"] }));

app.use((req, res, next) => {
  // Generér en unik nonce per request
  const nonce = crypto.randomBytes(16).toString("base64");
  console.log("Generated nonce:", nonce);

  const cspHeader = `default-src 'self'; script-src 'self' 'nonce-rAnd0m'; style-src 'self'`;
  // const cspReportOnly = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; report-uri /csp-report`;
  const cspReportOnly = `default-src 'self'; script-src 'self' 'nonce-rAnd0m'; report-uri /csp-report`;

  res.setHeader("Content-Security-Policy", cspHeader);
  res.setHeader("Content-Security-Policy-Report-Only", cspReportOnly);

  // Gem nonce til brug i views
  res.locals.nonce = nonce;

  next();
});

// CSP-rapporter
app.post("/csp-report", (req, res) => {
  console.log("🔒 CSP REPORT RECEIVED:\n", JSON.stringify(req.body, null, 2));
  res.sendStatus(204);
});

// Server statiske filer
app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`CSP demo kører på http://localhost:${port}`);
});
