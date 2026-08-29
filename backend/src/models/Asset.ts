import { Schema, model, Document } from "mongoose";

export interface IAsset extends Document {
  url: string;
  usage: string;
  originalName: string;
  mimetype: string;
  width?: number;
  height?: number;
  size: number;
  createdAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    url: { type: String, required: true },
    usage: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimetype: { type: String, default: "" },
    width: { type: Number },
    height: { type: Number },
    size: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AssetSchema.index({ createdAt: -1 });

export default model<IAsset>("Asset", AssetSchema);
