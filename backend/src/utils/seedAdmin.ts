// Run with: npm run seed
// Creates the single admin account allowed to log in, using the
// ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_PHONE / ADMIN_NAME values from
// .env. This is meant to be run ONCE on first deployment. After that,
// admins log in with this username+password and can change the password
// themselves (via OTP sent to ADMIN_PHONE) — running seed again will NOT
// overwrite an existing account, so a lost/changed password is never
// silently reset by re-running this script.
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin";

async function run() {
  const { MONGODB_URI, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_NAME } = process.env;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env");
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_PHONE) {
    throw new Error("ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_PHONE must all be set in .env before seeding.");
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  await mongoose.connect(MONGODB_URI);

  const username = ADMIN_USERNAME.toLowerCase().trim();
  const existing = await Admin.findOne({ username });

  if (existing) {
    console.log(`[seed] Admin "${username}" already exists — skipping (password NOT touched).`);
    console.log(`[seed] To change the password, log in and use the admin "Change Password" flow (OTP required).`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await Admin.create({
      username,
      name: ADMIN_NAME || "Site Administrator",
      phone: ADMIN_PHONE.trim(),
      passwordHash,
    });
    console.log(`[seed] Admin account created:`);
    console.log(`        username: ${username}`);
    console.log(`        phone:    ${ADMIN_PHONE.trim()} (this is where OTP codes will be sent)`);
    console.log(`[seed] IMPORTANT: log in once and change this password from the admin panel.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seed] Failed:", err.message || err);
  process.exit(1);
});
