const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// MongoDB connection
mongoose
  .connect("mongodb://host.docker.internal:27017/roleAuthApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user", "guest"], default: "guest" },
});
const User = mongoose.model("User", UserSchema);

// Middleware setup
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please log in to view that resource");
  res.redirect("/login");
};

// Role-based access control middleware
const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      return next();
    }
    req.flash("error", "You are not authorized to access this page");
    res.redirect("/dashboard");
  };
};

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
app.get("/", (req, res) => {
  res.render("index", {
    user: req.user,
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// Registration routes
app.get("/register", (req, res) => {
  res.render("register", { error: req.flash("error") });
});

app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      req.flash("error", "Username already exists");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      role: role || "guest",
    });

    await user.save();
    req.flash("success", "Registration successful! Please log in.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error during registration");
    res.redirect("/register");
  }
});

// Login routes
app.get("/login", (req, res) => {
  res.render("login", { error: req.flash("error") });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Logout route
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out");
    res.redirect("/");
  });
});

// Dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user, error: req.flash('error') });
});

// Role-specific routes
app.get("/admin", isAuthenticated, checkRole("admin"), (req, res) => {
  res.render("admin", { user: req.user });
});

app.get("/user", isAuthenticated, checkRole("user"), (req, res) => {
  res.render("user", { user: req.user });
});

app.get("/guest", isAuthenticated, checkRole("guest"), (req, res) => {
  res.render("guest", { user: req.user });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash("error", "Something went wrong!");
  res.redirect("/");
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
