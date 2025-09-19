import { useEffect, useRef } from "react";


const API_URL = import.meta.env.VITE_API_URL as string;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;


export default function GoogleLoginButton() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const g = window.google?.accounts?.id;
    if (!g || !divRef.current || !GOOGLE_CLIENT_ID) return;

    // GoogleLoginButton.tsx  (μέσα στον callback)
    // GoogleLoginButton.tsx
    const callback = async (resp: google.accounts.id.CredentialResponse) => {
      try {
        const r = await fetch(`${API_URL}/api/v1/login/google-id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: resp.credential }),
          // credentials: "include", // μόνο αν ο server γυρίζει cookie session
        });

        const text = await r.text();
        if (!r.ok) throw new Error(text || `HTTP ${r.status}`);

        // --- χωρίς any: parse ως unknown και κάνε safe narrowing
        let payload: unknown = {};
        if (text) {
          try {
            payload = JSON.parse(text) as unknown;
          } catch {
            payload = {};
          }
        }

        const pickToken = (obj: unknown): string | null => {
          if (obj === null || typeof obj !== "object") return null;
          const o = obj as Record<string, unknown>;
          const keys = ["accessToken", "access_token", "token", "jwt"] as const;
          for (const k of keys) {
            const v = o[k];
            if (typeof v === "string" && v.length > 0) return v;
          }
          return null;
        };

        const token = pickToken(payload);
        if (!token) throw new Error("No access token in server response");

        localStorage.setItem("auth_token", token);
        window.dispatchEvent(new Event("auth:login"));
      } catch (err) {
        console.error("Google auth failed:", err);
        alert("Google sign-in failed");
      }
    };



    g.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      callback,
    });

    g.renderButton(divRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "rectangular",
    });


    // g.prompt();
  }, []);

  return <div ref={divRef} />;
}
