const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Sample data
let todos = [
  { id: 1, text: "Learn CORS", completed: false },
  { id: 2, text: "Build secure applications", completed: false },
];

// Configure CORS with restrictive settings
app.use(
  cors({
    // Access-Control-Allow-Origin - Tillad kun disse origins
    origin: ["http://localhost:8080", "http://localhost:8081"],

    // Access-Control-Allow-Methods - Tillad kun disse HTTP-metoder
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    // Access-Control-Allow-Headers - Tillad kun disse headers fra klienten
    allowedHeaders: ["Content-Type"],

    // Access-Control-Allow-Credentials - Tillad credentials (cookies, auth headers)
    credentials: false,

    // Access-Control-Max-Age - Cache preflight requests i 10 minutter (600 sekunder)
    maxAge: 600,
  })
);

// Routes
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

app.post("/api/todos", (req, res) => {
  const newTodo = {
    id: todos.length + 1,
    text: req.body.text,
    completed: false,
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.delete("/api/todos/:id", (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex((todo) => todo.id === parseInt(id));

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todos = todos.filter((todo) => todo.id !== parseInt(id));
  res.status(204).send(); // Send no content on successful deletion
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
