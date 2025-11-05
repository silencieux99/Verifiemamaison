'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  email: string;
  createdAt: number | null;
  credits: number;
}

export default function UsersPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [note, setNote] = useState('');
  const [addingCredits, setAddingCredits] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user || !user.admin) {
      router.push('/admin/login');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!firebaseUser) return;
      try {
        setLoading(true);
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [firebaseUser]);

  const handleAddCredits = async () => {
    if (!selectedUser || !firebaseUser) return;

    const quantity = parseInt(creditsToAdd);
    if (!quantity || quantity <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un nombre de crédits valide (minimum 1)' });
      return;
    }

    setAddingCredits(true);
    setMessage(null);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/admin/users/${selectedUser.uid}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setCreditsToAdd('');
        setNote('');
        setShowModal(false);
        setSelectedUser(null);
        
        // Rafraîchir la liste des utilisateurs
        const usersRes = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'ajout des crédits' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout des crédits' });
    } finally {
      setAddingCredits(false);
    }
  };

  const openModal = (user: User) => {
    setSelectedUser(user);
    setCreditsToAdd('');
    setNote('');
    setMessage(null);
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Utilisateurs
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date d'inscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Crédits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Aucun utilisateur pour le moment
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {user.credits || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openModal(user)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                      Ajouter des crédits
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter des crédits */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ajouter des crédits
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Utilisateur : {selectedUser.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Crédits actuels : <span className="font-semibold text-purple-600 dark:text-purple-400">{selectedUser.credits || 0}</span>
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-md ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de crédits à ajouter
                </label>
                <input
                  id="credits"
                  type="number"
                  min="1"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 5"
                  disabled={addingCredits}
                />
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note (optionnel)
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Ajout manuel pour compensation..."
                  disabled={addingCredits}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setMessage(null);
                }}
                disabled={addingCredits}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCredits}
                disabled={addingCredits || !creditsToAdd || parseInt(creditsToAdd) <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingCredits ? 'Ajout en cours...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

