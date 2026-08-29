import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Agro Organica backend running on http://localhost:${PORT}`);
  });
}

start();
