import axios from "axios";

const BULKSMS_BASE_URL = "http://bulksmsbd.net/api/smsapi";
const API_KEY = process.env.BULKSMS_API_KEY;
const SENDER_ID = process.env.BULKSMS_SENDER_ID;

// bulksmsbd.net response code meanings
const RESPONSE_CODES: Record<number, string> = {
  202: "SMS Submitted Successfully",
  1001: "Invalid Number",
  1002: "Sender ID not correct/sender id is disabled",
  1003: "Please Required all fields/Contact Your System Administrator",
  1005: "Internal Error",
  1006: "Balance Validity Not Available",
  1007: "Balance Insufficient",
  1011: "User Id not found",
  1012: "Masking SMS must be sent in Bengali",
  1013: "Sender Id has not found Gateway by api key",
  1014: "Sender Type Name not found using this sender by api key",
  1015: "Sender Id has not found Any Valid Gateway by api key",
  1016: "Sender Type Name Active Price Info not found by this sender id",
  1017: "Sender Type Name Price Info not found by this sender id",
  1018: "The Owner of this (username) Account is disabled",
  1019: "The (sender type name) Price of this (username) Account is disabled",
  1020: "The parent of this account is not found.",
  1021: "The parent active (sender type name) price of this account is not found.",
  1031: "Your Account Not Verified, Please Contact Administrator.",
  1032: "IP Not whitelisted",
};

// Converts a local BD number (01XXXXXXXXX) to the 8801XXXXXXXXX format
// bulksmsbd expects.
export function toBDFormat(number: string): string {
  let n = String(number).trim();
  if (n.startsWith("+880")) return n.slice(1);
  if (n.startsWith("880")) return n;
  if (n.startsWith("0")) return `88${n}`;
  return `880${n}`;
}

export type SmsResult = {
  success: boolean;
  code: number | string;
  meaning: string;
  raw: any;
};

export async function sendSingleSMS(phoneNumber: string, message: string): Promise<SmsResult> {
  if (!API_KEY || !SENDER_ID) {
    // In development without SMS credentials configured, we don't want to
    // silently fail the whole OTP flow — log it so the admin can still test.
    console.warn(
      `[sms] BULKSMS_API_KEY / BULKSMS_SENDER_ID not set. Would have sent to ${phoneNumber}: "${message}"`
    );
    return { success: true, code: "DEV_MODE", meaning: "SMS not actually sent (no API credentials configured)", raw: null };
  }

  const response = await axios.get(BULKSMS_BASE_URL, {
    params: {
      api_key: API_KEY,
      type: "text",
      number: toBDFormat(phoneNumber),
      senderid: SENDER_ID,
      message,
    },
  });

  const data = response.data;
  const code = data?.response_code ?? data;
  const meaning = RESPONSE_CODES[Number(code)] || "Unknown response";

  return { success: Number(code) === 202, code, meaning, raw: data };
}

export function generateOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export async function sendOtpSms(phone: string, otp: string, purpose: "reset-password" | "change-password") {
  const minutes = process.env.OTP_EXPIRES_MINUTES || "5";
  const action = purpose === "reset-password" ? "reset your admin password" : "change your admin password";
  const message = `Your Agro Organica OTP to ${action} is ${otp}. It expires in ${minutes} minutes. Do not share this code with anyone.`;
  return sendSingleSMS(phone, message);
}

export async function getBalance() {
  if (!API_KEY) throw new Error("BULKSMS_API_KEY not configured");
  const response = await axios.get("http://bulksmsbd.net/api/getBalanceApi", {
    params: { api_key: API_KEY },
  });
  return response.data;
}
