'use client';

import { useState } from 'react';
import Container from './Container';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { HouseData } from '@/lib/types';

/**
 * Formulaire d'analyse de maison pour VerifieMaMaison
 */
export default function FormHouse() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HouseData>({
    address: '',
    postalCode: '',
    city: '',
    yearBuilt: undefined,
    surface: 0,
    rooms: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    generalCondition: 'bon_etat',
    roofCondition: 'bon',
    insulation: 'partielle',
    electrical: 'conforme',
    plumbing: 'acceptable',
    heating: 'gaz',
    diagnostics: {
      plomb: false,
      amiante: false,
      termites: false,
      dpe: 'D'
    },
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('diagnostics.')) {
      const diagnosticKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        diagnostics: {
          ...prev.diagnostics,
          [diagnosticKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firebaseUser) {
      router.push('/login?redirect=/');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          houseData: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport');
      }

      const data = await response.json();
      router.push(`/report/${data.reportId}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Analysez votre bien immobilier
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Remplissez le formulaire ci-dessous pour générer votre rapport complet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-8 space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Informations générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Année de construction</label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Surface (m²)</label>
                <input
                  type="number"
                  name="surface"
                  value={formData.surface}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de pièces</label>
                <input
                  type="number"
                  name="rooms"
                  value={formData.rooms || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* État général */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">État du bien</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État général</label>
              <select
                name="generalCondition"
                value={formData.generalCondition}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="neuf">Neuf</option>
                <option value="bon_etat">Bon état</option>
                <option value="moyen">État moyen</option>
                <option value="renover">À rénover</option>
                <option value="ruine">En ruine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État de la toiture</label>
              <select
                name="roofCondition"
                value={formData.roofCondition}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="neuf">Neuf</option>
                <option value="bon">Bon</option>
                <option value="moyen">Moyen</option>
                <option value="degrade">Dégradé</option>
                <option value="critique">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Isolation</label>
              <select
                name="insulation"
                value={formData.insulation}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="aucune">Aucune</option>
                <option value="partielle">Partielle</option>
                <option value="complete">Complète</option>
                <option value="excellente">Excellente</option>
              </select>
            </div>
          </div>

          {/* Installations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Installations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Installation électrique</label>
                <select
                  name="electrical"
                  value={formData.electrical}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="conforme">Conforme</option>
                  <option value="obsolète">Obsolète</option>
                  <option value="dangereux">Dangereux</option>
                  <option value="inconnu">Inconnu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plomberie</label>
                <select
                  name="plumbing"
                  value={formData.plumbing}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="moderne">Moderne</option>
                  <option value="acceptable">Acceptable</option>
                  <option value="obsolète">Obsolète</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chauffage</label>
              <select
                name="heating"
                value={formData.heating}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="electrique">Électrique</option>
                <option value="gaz">Gaz</option>
                <option value="fioul">Fioul</option>
                <option value="bois">Bois</option>
                <option value="pompe_chaleur">Pompe à chaleur</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Diagnostics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Diagnostics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="diagnostics.plomb"
                  checked={formData.diagnostics?.plomb || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500"
                />
                <span className="text-gray-300">Plomb</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="diagnostics.amiante"
                  checked={formData.diagnostics?.amiante || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500"
                />
                <span className="text-gray-300">Amiante</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="diagnostics.termites"
                  checked={formData.diagnostics?.termites || false}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500"
                />
                <span className="text-gray-300">Termites</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">DPE</label>
                <select
                  name="diagnostics.dpe"
                  value={formData.diagnostics?.dpe || 'D'}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes complémentaires</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Ajoutez toute information supplémentaire pertinente..."
            />
          </div>

          {/* Bouton de soumission */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Génération du rapport...' : 'Générer mon rapport'}
            </button>
            {!firebaseUser && (
              <p className="text-sm text-gray-400 mt-2 text-center">
                Vous devez être connecté pour générer un rapport. <a href="/login" className="text-purple-400 hover:underline">Se connecter</a>
              </p>
            )}
          </div>
        </form>
      </div>
    </Container>
  );
}

