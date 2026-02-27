import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, SubscriptionStatus, PLAN_LIMITS, PlanLimits } from '../types';
import { supabase } from '../lib/supabase';
import { ensureStorageBuckets } from '../lib/setupStorage';
import type { Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '../types/database';

export type AuthScreen = 'login' | 'register' | 'forgot';

interface AuthContextValue {
  currentUser: User;
  planLimits: PlanLimits;
  isPremium: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => void;
  canAddStudent: (currentCount: number) => boolean;
  refreshSubscription: () => Promise<void>;
}

const EMPTY_USER: User = {
  id: '',
  name: '',
  email: '',
  subscriptionStatus: 'free',
  isAdmin: false,
};

function profileToUser(profile: Profile, isAdmin: boolean): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? undefined,
    avatarUrl: profile.avatar_url ?? undefined,
    subscriptionStatus: (profile.subscription_status || 'free') as SubscriptionStatus,
    subscriptionProductId: profile.subscription_product_id ?? undefined,
    subscriptionEndDate: profile.subscription_end_date ?? undefined,
    isAdmin,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const mountedRef = useRef(true);

  const isAuthenticated = !!session;
  const isPremium = currentUser.subscriptionStatus === 'active';
  const isAdmin = currentUser.isAdmin;
  const planLimits = PLAN_LIMITS[currentUser.subscriptionStatus] || PLAN_LIMITS.free;

  // Fetch profile + role from DB
  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    try {
      // Parallel fetch: profile + roles
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileRes.error) {
        console.error('[Auth] fetchProfile error:', profileRes.error.message);
        return null;
      }

      const profile = profileRes.data as Profile;
      const roles = (rolesRes.data || []) as UserRole[];
      const hasAdmin = roles.some(r => r.role === 'admin');

      console.log('[Auth] Profile loaded:', profile.id, profile.name, 'admin:', hasAdmin);
      return profileToUser(profile, hasAdmin);
    } catch (e) {
      console.error('[Auth] Error fetching user data:', e);
      return null;
    }
  }, []);

  // Check subscription via Stripe edge function
  const refreshSubscription = useCallback(async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.warn('[Auth] check-subscription error:', error.message);
        return;
      }
      if (data) {
        const newStatus: SubscriptionStatus = data.subscribed ? 'active' : 'free';
        setCurrentUser(prev => ({
          ...prev,
          subscriptionStatus: newStatus,
          subscriptionProductId: data.product_id || undefined,
          subscriptionEndDate: data.subscription_end || undefined,
        }));
      }
    } catch (e) {
      console.warn('[Auth] Subscription check failed:', e);
    }
  }, [session]);

  // Auth state listener
  useEffect(() => {
    mountedRef.current = true;
    let resolved = false;

    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        if (s?.user) {
          const user = await fetchUserData(s.user.id);
          if (mountedRef.current && user) setCurrentUser(user);
          setSession(s);
        }
      } finally {
        if (mountedRef.current && !resolved) {
          resolved = true;
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        console.log(`[Auth] ${event} user=${s?.user?.id ?? 'none'}`);
        setSession(s ?? null);

        if (s?.user) {
          const user = await fetchUserData(s.user.id);
          if (mountedRef.current) {
            if (user) {
              setCurrentUser(user);
            } else {
              // Retry after 1s (trigger delay on signup)
              setTimeout(async () => {
                const retry = await fetchUserData(s.user.id);
                if (mountedRef.current && retry) setCurrentUser(retry);
              }, 1000);
            }
          }
          ensureStorageBuckets();
        } else {
          setCurrentUser(EMPTY_USER);
        }

        if (mountedRef.current && !resolved) {
          resolved = true;
          setLoading(false);
        }
      }
    );

    const safetyTimeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 4000);

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      mountedRef.current = false;
    };
  }, [fetchUserData]);

  // Auto-check subscription on login
  useEffect(() => {
    if (isAuthenticated && currentUser.id) {
      refreshSubscription();
    }
  }, [isAuthenticated, currentUser.id, refreshSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) throw new Error('Email e senha são obrigatórios');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) throw new Error('Email ou senha incorretos');
      throw new Error(error.message);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!name.trim() || !email || !password) throw new Error('Todos os campos são obrigatórios');
    if (password.length < 6) throw new Error('Senha deve ter pelo menos 6 caracteres');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      if (error.message.includes('already registered')) throw new Error('Este email já está cadastrado');
      throw new Error(error.message);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    if (!email) throw new Error('Email é obrigatório');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(EMPTY_USER);
    setAuthScreen('login');
  }, []);

  const updateUser = useCallback(async (updates: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => {
    if (!session?.user) return;
    const profileUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.email !== undefined) profileUpdates.email = updates.email;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', session.user.id);
      if (error) { console.error('[Auth] Update error:', error.message); return; }
    }
    setCurrentUser(prev => ({ ...prev, ...updates }));
  }, [session]);

  const canAddStudent = useCallback((currentCount: number) => {
    return currentCount < planLimits.maxStudents;
  }, [planLimits.maxStudents]);

  return (
    <AuthContext.Provider value={{
      currentUser, planLimits, isPremium, isAdmin, isAuthenticated, loading,
      authScreen, setAuthScreen, login, loginWithGoogle, register, forgotPassword,
      logout, updateUser, canAddStudent, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
