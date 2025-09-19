// src/api/auth.ts
import { api } from "./client";

export type TestTokenResponse = { valid: boolean };

// Clean wrapper around /login/test-token using our api() that already
// injects Authorization from localStorage (no need to send token in body).
export async function testToken(): Promise<TestTokenResponse> {
  try {
    const res = await api<TestTokenResponse>("/login/test-token"); // GET by default
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Test token failed:", msg);
    throw err;
  }
}
