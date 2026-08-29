import { UAParser } from "ua-parser-js";
import { Request } from "express";

export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "";
}

export function parseDevice(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(" ") || "Unknown";
  const os = [result.os.name, result.os.version].filter(Boolean).join(" ") || "Unknown";
  const deviceModel = [result.device.vendor, result.device.model].filter(Boolean).join(" ") || "Desktop/Unknown";
  const deviceType = result.device.type || "desktop";
  return { browser, os, deviceModel, deviceType };
}
