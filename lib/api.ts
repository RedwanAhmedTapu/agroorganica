import { AppData } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  details?: string[];
  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include", // send/receive the httpOnly admin session cookie — never localStorage
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body?.details);
  }
  return body as T;
}

// ---------- Site content ----------

export const getContent = () => request<AppData>("/api/content");
export const saveContent = (data: Partial<AppData>) =>
  request<AppData>("/api/content", { method: "PUT", body: JSON.stringify(data) });
export const submitContactMessage = (msg: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
}) => request("/api/content/messages", { method: "POST", body: JSON.stringify(msg) });
export const deleteMessage = (id: string) => request(`/api/content/messages/${id}`, { method: "DELETE" });

// ---------- Footer / social links ----------

export type SocialLink = { id: string; platform: string; icon: string; url: string; color?: string; active: boolean };

export const getFooterSettings = () => request<{ socialLinks: SocialLink[]; allowedIcons: string[] }>("/api/footer");
export const saveFooterSettings = (socialLinks: SocialLink[]) =>
  request<{ socialLinks: SocialLink[] }>("/api/footer", { method: "PUT", body: JSON.stringify({ socialLinks }) });

// ---------- Auth ----------

export type AdminProfile = { id: string; username: string; name: string; phone: string };

export const login = (username: string, password: string) =>
  request<{ success: true; admin: AdminProfile }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
export const logout = () => request("/api/auth/logout", { method: "POST" });
export const me = () => request<AdminProfile>("/api/auth/me");

export const forgotPasswordStart = (username: string) =>
  request<{ success: true; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
export const forgotPasswordResend = (username: string) =>
  request<{ success: true; message: string }>("/api/auth/forgot-password/resend", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
export const forgotPasswordVerify = (username: string, otp: string, newPassword: string) =>
  request<{ success: true; message: string }>("/api/auth/forgot-password/verify", {
    method: "POST",
    body: JSON.stringify({ username, otp, newPassword }),
  });

export const changePasswordStart = (currentPassword: string) =>
  request<{ success: true; message: string }>("/api/auth/change-password/start", {
    method: "POST",
    body: JSON.stringify({ currentPassword }),
  });
export const changePasswordResend = () =>
  request<{ success: true; message: string }>("/api/auth/change-password/resend", { method: "POST" });
export const changePasswordVerify = (otp: string, newPassword: string) =>
  request<{ success: true; message: string }>("/api/auth/change-password/verify", {
    method: "POST",
    body: JSON.stringify({ otp, newPassword }),
  });

export type LoginLogEntry = {
  id: string;
  success: boolean;
  reason?: string;
  ip: string;
  browser: string;
  os: string;
  deviceModel: string;
  deviceType: string;
  at: string;
};
export const getLoginHistory = () => request<{ logs: LoginLogEntry[] }>("/api/auth/login-history");

// ---------- Uploads ----------

export type UploadUsage =
  | "home-grid"
  | "brand-logo"
  | "product"
  | "media-gallery"
  | "profile"
  | "achievement"
  | "navbar-logo"
  | "site-general";

export async function uploadImageFile(file: File, usage: UploadUsage = "site-general") {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_URL}/api/upload/image?usage=${usage}`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error || "Upload failed", res.status, body?.details);
  }
  return body as { success: true; url: string; width?: number; height?: number; kind: "image" | "video" };
}

export async function uploadPdfFile(file: File) {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch(`${API_URL}/api/upload/pdf`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error || "Upload failed", res.status, body?.details);
  }
  return body as { success: true; url: string; originalName: string };
}

export const deleteUpload = (url: string) => request(`/api/upload?url=${encodeURIComponent(url)}`, { method: "DELETE" });
export const bulkDeleteUploads = (urls: string[]) =>
  request<{ removed: string[]; skipped: string[] }>("/api/upload/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });

// ---------- Image library (shared asset browser) ----------

export type Asset = {
  id: string;
  url: string;
  usage: string;
  originalName: string;
  mimetype: string;
  width?: number;
  height?: number;
  size: number;
  createdAt: string;
};

export const listAssets = (usage?: string) =>
  request<{ assets: Asset[] }>(`/api/assets${usage && usage !== "all" ? `?usage=${usage}` : ""}`);
