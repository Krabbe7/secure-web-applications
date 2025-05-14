const express = require("express");
const bodyParser = require("body-parser");
const xssFilters = require("xss-filters");
const app = express();
const port = 3000;

// Set up EJS as the view engine
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Store comments in memory (sanitized comments only)
let comments = [];

// Route: Home page - display message
app.get("/", (req, res) => {
  const rawMessage = req.query.message || "";
  const sanitizedMessage = xssFilters.inHTMLData(rawMessage);

  res.render("index", {
    comments: comments,
    message: sanitizedMessage,
    searchQuery: "",
  });
});

// Route: Add comment (sanitize input before storing)
app.post("/comment", (req, res) => {
  const rawComment = req.body.comment || "";
  const sanitizedComment = xssFilters.inHTMLData(rawComment);

  comments.push(sanitizedComment);

  res.redirect("/");
});

// Route: Search - display sanitized query
app.get("/search", (req, res) => {
  const rawQuery = req.query.q || "";
  const sanitizedQuery = xssFilters.inHTMLData(rawQuery);

  res.render("index", {
    comments: comments,
    message: "",
    searchQuery: sanitizedQuery,
  });
});

app.listen(port, () => {
  console.log(`Secure app listening at http://localhost:${port}`);
});
