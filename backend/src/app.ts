import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/authRoutes";
import contentRoutes from "./routes/contentRoutes";
import footerRoutes from "./routes/footerRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import assetRoutes from "./routes/assetRoutes";
import smsRoutes from "./routes/smsRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically — e.g. /uploads/home/xyz.jpg
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.status(200).json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/footer", footerRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/sms", smsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler — multer file-size errors, JSON parse errors, etc.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large." });
  }
  res.status(err?.status || 500).json({ error: err?.message || "Internal server error" });
});

export default app;
