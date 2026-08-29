import { Schema, model, Document, Types } from "mongoose";

export interface ILoginLog extends Document {
  admin: Types.ObjectId;
  success: boolean;
  reason?: string; // e.g. "wrong_password", "otp_login" etc when success=false or special event
  ip: string;
  userAgentRaw: string;
  browser: string;
  os: string;
  deviceModel: string;
  deviceType: string; // mobile | tablet | desktop
  at: Date;
}

const LoginLogSchema = new Schema<ILoginLog>({
  admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  success: { type: Boolean, required: true },
  reason: { type: String },
  ip: { type: String, default: "" },
  userAgentRaw: { type: String, default: "" },
  browser: { type: String, default: "Unknown" },
  os: { type: String, default: "Unknown" },
  deviceModel: { type: String, default: "Unknown" },
  deviceType: { type: String, default: "desktop" },
  at: { type: Date, default: Date.now },
});

LoginLogSchema.index({ admin: 1, at: -1 });

export default model<ILoginLog>("LoginLog", LoginLogSchema);
