'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Container from '@/app/(components)/Container';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';

function LoginContentInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Détecter le mode et l'email depuis l'URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    const emailParam = searchParams.get('email');
    const redirect = searchParams.get('redirect');
    
    if (mode === 'signup') {
      setIsSignUp(true);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validation du mot de passe de confirmation
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
          setLoading(false);
          return;
        }

        // Création du compte
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Créer le document utilisateur dans Firestore
        try {
          const response = await fetch('/api/auth/create-user-document', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: userCredential.user.uid,
              email: email,
              displayName: email.split('@')[0]
            }),
          });

          if (!response.ok) {
            console.warn('Erreur lors de la création du document utilisateur:', await response.text());
          }
        } catch (docError) {
          console.warn('Erreur lors de la création du document utilisateur:', docError);
        }

        setMessage('Compte créé avec succès !');
        const redirect = searchParams.get('redirect') || '/account';
        setTimeout(() => {
          router.push(redirect);
        }, 1500);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const redirect = searchParams.get('redirect') || '/account';
        router.push(redirect);
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Adresse e-mail invalide.';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse e-mail.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      case 'auth/weak-password':
        return 'Le mot de passe doit comporter au moins 6 caractères.';
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      default:
        return "Une erreur s'est produite. Veuillez réessayer.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <Container className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Logo et titre */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                VerifieMaMaison
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? 'Commencez à analyser vos biens immobiliers' : 'Accédez à vos rapports et crédits'}
            </p>
          </div>

          {/* Formulaire */}
          <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse e-mail
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {/* Champ de confirmation de mot de passe pour l'inscription */}
              {isSignUp && (
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <p className="text-sm text-green-600">{message}</p>
              </motion.div>
            )}

            {/* Bouton de soumission */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-pink-600 py-3 px-4 text-base font-semibold text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Création du compte...' : 'Connexion...'}
                  </span>
                ) : (
                  isSignUp ? 'S\'inscrire' : 'Se connecter'
                )}
              </button>
            </div>
          </form>

          {/* Basculer entre connexion et inscription */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
                setConfirmPassword('');
              }}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              {isSignUp
                ? 'Vous avez déjà un compte? Se connecter'
                : "Pas de compte? S'inscrire"}
            </button>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}

function LoginContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center py-12">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </Container>
      </div>
    }>
      <LoginContentInner />
    </Suspense>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}
