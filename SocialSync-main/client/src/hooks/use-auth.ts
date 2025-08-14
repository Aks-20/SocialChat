import { useAuthContext } from '../lib/auth.tsx';

export function useAuth() {
  return useAuthContext();
}
