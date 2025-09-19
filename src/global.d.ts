/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_AF_HOST: string;
  readonly VITE_AF_KEY: string;
  // πρόσθεσε εδώ ό,τι άλλο VITE_* έχεις
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
