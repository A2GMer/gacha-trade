"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithX: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // 初期セッション取得
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 認証状態変更の監視
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const signUp = useCallback(
        async (email: string, password: string, displayName: string) => {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: displayName },
                },
            });
            if (error) return { error: error.message };

            // プロフィールの作成は Supabase のトリガーまたは手動で実行
            return { error: null };
        },
        [supabase.auth]
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { error: error.message };
            return { error: null };
        },
        [supabase.auth]
    );

    const signInWithX = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'twitter',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        if (error) return { error: error.message };
        return { error: null };
    }, [supabase.auth]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, [supabase.auth]);

    return (
        <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithX, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
