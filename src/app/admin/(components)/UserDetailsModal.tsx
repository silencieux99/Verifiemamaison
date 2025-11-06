'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, CreditCardIcon, ShieldExclamationIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface User {
  uid: string;
  email?: string;
  credits?: number;
  createdAt?: number;
  admin?: boolean;
  blocked?: boolean;
  [key: string]: any;
}

interface Order {
  id: string;
  amount?: number;
  status?: string;
  createdAt?: number;
  productName?: string;
  [key: string]: any;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  lastOrder: Order | null;
  firebaseUser: any;
}

export default function UserDetailsModal({ isOpen, onClose, user, lastOrder, firebaseUser }: UserDetailsModalProps) {
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendEmail = () => {
    if (user.email) {
      window.location.href = `mailto:${user.email}?subject=Votre compte VerifieMaMaison`;
    }
  };

  const handleSendEmailWithPassword = async () => {
    if (!user.email || !firebaseUser) return;
    
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/admin/users/${user.uid}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sendEmail: true }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email avec mot de passe envoyé' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de l\'email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi de l\'email' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!creditsToAdd || !firebaseUser) return;
    
    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un nombre valide' });
      return;
    }

    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/admin/users/${user.uid}/credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: credits }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${credits} crédits ajoutés avec succès` });
        setCreditsToAdd('');
        // Rafraîchir les données utilisateur
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de crédits' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de crédits' });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/admin/users/${user.uid}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocked: !user.blocked }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: user.blocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué' });
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la modification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la modification' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    Fiche client
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  {/* Informations utilisateur */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white break-all">{user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">UID</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono text-xs break-all">{user.uid}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Crédits</label>
                      <p className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">{user.credits || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Date d'inscription</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                    </div>
                    {user.admin && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Rôle</label>
                        <p className="mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Administrateur
                          </span>
                        </p>
                      </div>
                    )}
                    {user.blocked && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Statut</label>
                        <p className="mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Bloqué
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dernière commande */}
                  {lastOrder && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Dernière commande</label>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">ID</span>
                          <span className="text-sm font-mono text-gray-900 dark:text-white">{lastOrder.id?.substring(0, 8) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Montant</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {lastOrder.amount ? `${(lastOrder.amount / 100).toFixed(2)}€` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Statut</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            lastOrder.status === 'paid' || lastOrder.status === 'COMPLETE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {lastOrder.status || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Date</span>
                          <span className="text-sm text-gray-900 dark:text-white">{formatDate(lastOrder.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Ajouter des crédits</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={creditsToAdd}
                          onChange={(e) => setCreditsToAdd(e.target.value)}
                          placeholder="Nombre de crédits"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          min="1"
                        />
                        <button
                          onClick={handleAddCredits}
                          disabled={loading || !creditsToAdd}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <CreditCardIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Ajouter</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleSendEmail}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        Envoyer email
                      </button>
                      <button
                        onClick={handleSendEmailWithPassword}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        Email + MDP
                      </button>
                      <button
                        onClick={handleBlockUser}
                        disabled={loading}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
                          user.blocked
                            ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                            : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                        }`}
                      >
                        {user.blocked ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            Débloquer
                          </>
                        ) : (
                          <>
                            <ShieldExclamationIcon className="w-4 h-4" />
                            Bloquer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}



