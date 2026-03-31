import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import availabilityRoutes from "./routes/availability.js";
import bookingRoutes from "./routes/bookings.js";
import publicRoutes from "./routes/public.js";
import calendarRoutes from "./routes/calendar.js";
import profileRoutes from "./routes/profile.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/profile", profileRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use((_, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
