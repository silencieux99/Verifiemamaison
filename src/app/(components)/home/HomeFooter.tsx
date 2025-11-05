'use client';

import Link from 'next/link';
import Container from '../Container';

/**
 * Footer de la page d'accueil pour VerifieMaMaison
 */
export default function HomeFooter() {
  return (
    <footer className="bg-gray-50 border-t border-purple-200 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">VerifieMaMaison</h3>
            <p className="text-gray-600 text-sm">
              Le service n°1 pour l'analyse de biens immobiliers en France. 
              Obtenez un rapport complet (structure, défauts, etc.) en quelques minutes.
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tarifs" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal#about" className="text-gray-600 hover:text-purple-600 transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/legal#credits" className="text-gray-600 hover:text-purple-600 transition-colors">
                  Crédits
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="mailto:contact@verifiemamaison.fr" className="text-gray-600 hover:text-purple-600 transition-colors">
                  contact@verifiemamaison.fr
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-gray-600 hover:text-purple-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Paiements */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Paiements sécurisés</h3>
            <p className="text-gray-600 text-sm mb-3">
              Cartes bancaires acceptées
            </p>
            <div className="flex gap-2">
              <span className="text-xs text-gray-500">Visa</span>
              <span className="text-xs text-gray-500">Mastercard</span>
              <span className="text-xs text-gray-500">CB</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-purple-200 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} VerifieMaMaison.fr - Tous droits réservés</p>
        </div>
      </Container>
    </footer>
  );
}

