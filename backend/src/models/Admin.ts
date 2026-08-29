import { Schema, model, Document } from "mongoose";

export interface IAdmin extends Document {
  username: string;
  name: string;
  phone: string; // used to receive OTP SMS, must be a valid BD number
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IAdmin>("Admin", AdminSchema);
