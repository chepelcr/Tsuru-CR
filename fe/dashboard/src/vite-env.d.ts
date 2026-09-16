/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_API_URL: string;
  readonly VITE_AWS_REGION?: string;
  readonly VITE_ADMIN_COGNITO_USER_POOL_ID: string;
  readonly VITE_ADMIN_COGNITO_CLIENT_ID: string;
  readonly VITE_APPSYNC_EVENTS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
