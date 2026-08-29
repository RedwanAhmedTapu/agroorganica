import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  adminId?: string;
}

const COOKIE_NAME = "ao_token";

export function signToken(adminId: string) {
  const secret = process.env.JWT_TOKEN as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    { sub: adminId },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const cookieToken = req.cookies?.[COOKIE_NAME];
    const header = req.headers.authorization;

    const bearerToken = header?.startsWith("Bearer ")
      ? header.slice(7)
      : undefined;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const secret = process.env.JWT_TOKEN as string;

    const payload = jwt.verify(token, secret) as {
      sub: string;
    };

    req.adminId = payload.sub;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}

export { COOKIE_NAME };