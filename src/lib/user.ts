import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Credits, User, PlanType } from './types';

/**
 * Récupère les informations d'un utilisateur
 */
export async function getUser(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return null;
    }
    return { uid, ...userDoc.data() } as User;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

/**
 * Crée ou met à jour un utilisateur
 */
export async function createOrUpdateUser(uid: string, email: string, data?: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    const userData: Partial<User> = {
      uid,
      email,
      updatedAt: Date.now(),
      ...data,
    };

    if (!userDoc.exists()) {
      userData.createdAt = Date.now();
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, userData);
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de l\'utilisateur:', error);
    throw error;
  }
}

/**
 * Récupère les crédits d'un utilisateur
 */
export async function getUserCredits(uid: string): Promise<number> {
  try {
    const creditsDoc = await getDoc(doc(db, 'credits', uid));
    if (!creditsDoc.exists()) {
      return 0;
    }
    const credits = creditsDoc.data() as Credits;
    return credits.total || 0;
  } catch (error) {
    console.error('Erreur lors de la récupération des crédits:', error);
    return 0;
  }
}

/**
 * Ajoute des crédits à un utilisateur
 */
export async function addCredits(
  uid: string,
  quantity: number,
  source: 'unite' | 'pack3' | 'pack10',
  note?: string
): Promise<void> {
  try {
    const creditsRef = doc(db, 'credits', uid);
    const creditsDoc = await getDoc(creditsRef);

    const now = Date.now();
    const historyEntry = {
      type: 'add' as const,
      qty: quantity,
      source,
      ts: now,
      note,
    };

    if (!creditsDoc.exists()) {
      await setDoc(creditsRef, {
        uid,
        total: quantity,
        history: [historyEntry],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const credits = creditsDoc.data() as Credits;
      await updateDoc(creditsRef, {
        total: (credits.total || 0) + quantity,
        history: [...(credits.history || []), historyEntry],
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de crédits:', error);
    throw error;
  }
}

/**
 * Consomme un crédit
 */
export async function consumeCredit(
  uid: string,
  source: 'unite' | 'pack3' | 'pack10',
  note?: string
): Promise<boolean> {
  try {
    const creditsRef = doc(db, 'credits', uid);
    const creditsDoc = await getDoc(creditsRef);

    if (!creditsDoc.exists()) {
      return false;
    }

    const credits = creditsDoc.data() as Credits;
    const currentTotal = credits.total || 0;

    if (currentTotal <= 0) {
      return false;
    }

    const now = Date.now();
    const historyEntry = {
      type: 'consume' as const,
      qty: 1,
      source,
      ts: now,
      note,
    };

    await updateDoc(creditsRef, {
      total: currentTotal - 1,
      history: [...(credits.history || []), historyEntry],
      updatedAt: now,
    });

    return true;
  } catch (error) {
    console.error('Erreur lors de la consommation de crédit:', error);
    return false;
  }
}

