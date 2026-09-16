import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import '../lib/amplify';

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'platform_admin';
}

export interface AdminChallenge {
  step: string;
  setupUri?: string;
  sharedSecret?: string;
}

async function currentAdminProfile(): Promise<AdminProfile> {
  const [current, session] = await Promise.all([getCurrentUser(), fetchAuthSession()]);
  const claims = session.tokens?.idToken?.payload;
  const id = typeof claims?.sub === 'string' ? claims.sub : current.userId;
  const email = typeof claims?.email === 'string' ? claims.email : current.username;
  return {
    id,
    email,
    username: typeof claims?.['cognito:username'] === 'string'
      ? claims['cognito:username'] : current.username,
    firstName: typeof claims?.given_name === 'string' ? claims.given_name : undefined,
    lastName: typeof claims?.family_name === 'string' ? claims.family_name : undefined,
    role: 'platform_admin',
  };
}

function challengeFrom(nextStep: any, email?: string): AdminChallenge {
  const details = nextStep?.totpSetupDetails;
  return {
    step: nextStep?.signInStep || 'UNKNOWN',
    setupUri: details?.getSetupUri
      ? details.getSetupUri('Tsuru Admin', email || 'administrator').toString()
      : undefined,
    sharedSecret: typeof details?.sharedSecret === 'string' ? details.sharedSecret : undefined,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      try {
        return await currentAdminProfile();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const login = useMutation({
    mutationFn: async (data: LoginData) => {
      try { await signOut(); } catch { /* no previous session */ }
      const result = await signIn({ username: data.email, password: data.password });
      if (!result.isSignedIn) {
        return { user: null, challenge: challengeFrom(result.nextStep, data.email) };
      }
      const user = await currentAdminProfile();
      queryClient.setQueryData(['admin-profile'], user);
      return { user, challenge: null };
    },
  });

  const answerChallenge = useMutation({
    mutationFn: async ({ response, email }: { response: string; email?: string }) => {
      const result = await confirmSignIn({ challengeResponse: response });
      if (!result.isSignedIn) {
        return { user: null, challenge: challengeFrom(result.nextStep, email) };
      }
      const user = await currentAdminProfile();
      queryClient.setQueryData(['admin-profile'], user);
      return { user, challenge: null };
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async (email: string) => resetPassword({ username: email }),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => confirmResetPassword({
      username: data.email,
      confirmationCode: data.code,
      newPassword: data.newPassword,
    }),
  });

  const logout = async () => {
    try { await signOut(); } finally {
      queryClient.setQueryData(['admin-profile'], null);
      queryClient.clear();
    }
  };
  const forceLogout = async () => {
    try { await signOut({ global: true }); } catch { /* already signed out */ }
    queryClient.clear();
  };

  return {
    user: profile.data,
    isAuthenticated: !!profile.data,
    isLoading: profile.isLoading,
    refetchUser: profile.refetch,
    login,
    answerChallenge,
    forgotPassword,
    resetPassword: resetPasswordMutation,
    logout,
    forceLogout,
  };
}
