import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

const rawEventsEndpoint = (import.meta.env.VITE_APPSYNC_EVENTS_URL || '').trim().replace(/\/+$/, '');
export const EVENTS_ENDPOINT = rawEventsEndpoint
  ? (rawEventsEndpoint.endsWith('/event') ? rawEventsEndpoint : `${rawEventsEndpoint}/event`) : '';

const amplifyConfig = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      // Deliberately no fallback to the normal/POS pool. This console accepts
      // identities only from the dedicated admin Cognito stack.
      userPoolId: import.meta.env.VITE_ADMIN_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_ADMIN_COGNITO_CLIENT_ID || '',
      loginWith: {
        email: true,
        username: false,
      },
    },
  },
  ...(import.meta.env.VITE_APPSYNC_EVENTS_URL ? {
    API: {
      Events: {
        endpoint: EVENTS_ENDPOINT,
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
        defaultAuthMode: 'userPool' as const,
      },
    },
  } : {}),
};

Amplify.configure(amplifyConfig);

// Configure token storage to use localStorage for persistence across page refreshes
// This ensures the user session is maintained even after browser refresh
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  typeof window !== 'undefined' ? window.localStorage : undefined as any
);

export default amplifyConfig;
