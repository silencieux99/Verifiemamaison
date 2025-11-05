'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AppUser extends User {
  admin?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  userData: DocumentData | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const tokenResult = await fbUser.getIdTokenResult();
        const appUser: AppUser = {
          ...fbUser,
          admin: tokenResult.claims.admin === true,
        };
        setUser(appUser);

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData({ uid: doc.id, ...doc.data() });
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, () => {
          setUserData(null);
          setLoading(false);
        });
        return () => unsubSnapshot();
      } else {
        setUser(null);
        setFirebaseUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

