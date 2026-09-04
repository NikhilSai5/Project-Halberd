"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { browser } from "wxt/browser";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, profile: { name: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const googleProviderTokenKey = (userId: string) => `halberd.google.provider-token.${userId}`;

function authError(error: unknown): Error {
  return error instanceof Error ? error : new Error("Something went wrong. Please try again.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      if (data.session?.provider_token && data.session.user.id) {
        localStorage.setItem(googleProviderTokenKey(data.session.user.id), data.session.provider_token);
      }
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.provider_token && nextSession.user.id) {
        localStorage.setItem(googleProviderTokenKey(nextSession.user.id), nextSession.provider_token);
      }
      setSession(nextSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured. Add the public project URL and anon key.");
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      throw authError(signInError);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase is not configured. Add the public project URL and anon key.");
    setError(null);
    const redirectTo = browser.identity.getRedirectURL("oauth2");
    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (googleError) {
      setError(googleError.message);
      throw authError(googleError);
    }
    if (!data.url) throw new Error("Supabase did not return a Google sign-in URL.");

    const callbackUrl = await browser.runtime.sendMessage({
      type: "halberd-google-auth",
      authUrl: data.url,
    }) as string;
    const hash = callbackUrl.split("#")[1];
    const params = new URLSearchParams(hash || "");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) throw new Error("Google sign-in did not return a valid session.");

    const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (sessionError) {
      setError(sessionError.message);
      throw authError(sessionError);
    }
  };

  const signUp = async (email: string, password: string, profile: { name: string; phone: string }) => {
    if (!supabase) throw new Error("Supabase is not configured. Add the public project URL and anon key.");
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: profile.name, phone: profile.phone } },
    });
    if (signUpError) {
      setError(signUpError.message);
      throw authError(signUpError);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw authError(signOutError);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured. Add the public project URL and anon key.");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) throw authError(resetError);
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, configured: isSupabaseConfigured, error, signIn, signInWithGoogle, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
