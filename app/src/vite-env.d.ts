/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the real backend (server/). Unset → pure-demo / mock mode. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
