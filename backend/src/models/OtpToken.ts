import { Schema, model, Document, Types } from "mongoose";

export type OtpPurpose = "reset-password" | "change-password";

export interface IOtpToken extends Document {
  admin: Types.ObjectId;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  used: boolean;
  attempts: number;
  lastSentAt: Date;
  createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["reset-password", "change-password"], required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Mongo TTL index: auto-delete OTP docs 1 hour after expiry, keeps collection tidy.
OtpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

export default model<IOtpToken>("OtpToken", OtpTokenSchema);
