'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';

/**
 * Page temporaire d'inscription administrateur
 * À SUPPRIMER après création du premier admin
 */
export default function AdminRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (!secret) {
      setError('Le code secret est requis.');
      return;
    }

    setLoading(true);
    try {
      // Créer le compte Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Appeler l'API pour attribuer le rôle admin
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId,
          secret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du compte admin');
      }

      // Créer le document utilisateur dans Firestore
      try {
        await fetch('/api/auth/create-user-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userId,
            email: email,
            displayName: email.split('@')[0],
          }),
        });
      } catch (docError) {
        console.warn('Erreur lors de la création du document utilisateur:', docError);
      }

      setSuccess(true);
      
      // Rediriger vers la page de connexion admin après 2 secondes
      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cette adresse e-mail est déjà utilisée.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresse e-mail invalide.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de la création du compte.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="bg-white rounded-xl shadow-xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                VerifieMaMaison
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Inscription Administrateur
            </h2>
            <p className="text-sm text-gray-600">
              ⚠️ Page temporaire - À supprimer après création du premier admin
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compte créé avec succès !</h3>
              <p className="text-gray-600 mb-4">Redirection vers la page de connexion...</p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                    placeholder="admin@verifiemamaison.fr"
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
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

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
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-2">
                    Code secret
                  </label>
                  <input
                    id="secret"
                    name="secret"
                    type="password"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-base"
                    placeholder="Code secret d'accès"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Code requis pour créer un compte administrateur
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

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
                      Création en cours...
                    </span>
                  ) : (
                    'Créer le compte administrateur'
                  )}
                </button>
              </div>

              <div className="text-center">
                <a
                  href="/admin/login"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Déjà un compte ? Se connecter
                </a>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

