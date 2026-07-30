// lib/auth-jwt.ts — JWT auth for Flutter app + dual auth helper
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!;

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Dual auth: tries NextAuth session first, then JWT from Authorization header.
 * Returns user info or null.
 */
export async function getAuthUser(
  request?: Request
): Promise<{ id: string; name: string; email: string; role: string; image?: string | null } | null> {
  // 1. Try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      role: session.user.role ?? "",
      image: session.user.image,
    };
  }

  // 2. Try JWT from Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyJwt(token);
      if (payload) {
        return payload;
      }
    }
  }

  return null;
}
