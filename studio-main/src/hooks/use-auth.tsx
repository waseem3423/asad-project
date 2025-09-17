"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export type UserRole = "admin" | "cashier" | "worker";

type PaymentGatewaySettings = {
  easypaisaAccountNumber: string;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
};

type AppSettings = {
  appName: string;
  currency: string;
  paymentGateway: Partial<PaymentGatewaySettings>;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  role: UserRole | null;
  settings: AppSettings;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ appName: 'VetTrack', currency: '$', paymentGateway: {} });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Subscribe to settings changes
    const settingsDocRef = doc(db, "settings", "app");
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
            appName: data.appName || 'VetTrack',
            currency: data.currency || '$',
            paymentGateway: data.paymentGateway || {},
        });
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          // Default new users to 'worker' role, or handle as needed
          await setDoc(userDocRef, { role: 'worker', email: user.email });
          setRole('worker');
        }
      } else {
        setRole(null);
      }
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, role, settings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
