'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Container from './Container';
import { CreditsDisplay } from './CreditsDisplay';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUser, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-200 bg-white/95 backdrop-blur-lg shadow-md shadow-purple-500/5">
      <Container className="flex h-20 sm:h-24 md:h-28 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="VerifieMaMaison.fr - Accueil">
          <div className="h-14 sm:h-16 md:h-20 flex items-center">
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              VerifieMaMaison
            </span>
          </div>
        </Link>
        
        {/* Navigation desktop */}
        <nav className="hidden lg:flex items-center space-x-6" role="navigation">
          <CreditsDisplay />
          
          <Link 
            href="/tarifs" 
            className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
          >
            Tarifs
          </Link>
          <Link 
            href="/checkout" 
            className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium"
          >
            Acheter des packs
          </Link>
          <Link 
            href="/legal" 
            className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
          >
            Mentions légales
          </Link>
          
          {firebaseUser ? (
            <>
              <Link 
                href="/account" 
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Mon compte
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-200"
              >
                Connexion
              </Link>
              <Link 
                href="/create-account" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 font-medium"
              >
                S'inscrire
              </Link>
            </>
          )}
          
          <Link 
            href="mailto:contact@verifiemamaison.fr" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 font-medium"
          >
            Contact
          </Link>
        </nav>

        {/* Menu mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-700 hover:text-purple-600 p-2"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </Container>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-purple-200 bg-white/98 backdrop-blur-lg">
          <Container className="py-4 space-y-3">
            <CreditsDisplay />
            <Link href="/tarifs" className="block text-gray-700 hover:text-purple-600 py-2">
              Tarifs
            </Link>
            <Link href="/checkout" className="block text-gray-700 hover:text-purple-600 py-2">
              Acheter des packs
            </Link>
            <Link href="/legal" className="block text-gray-700 hover:text-purple-600 py-2">
              Mentions légales
            </Link>
            {firebaseUser ? (
              <>
                <Link href="/account" className="block text-gray-700 hover:text-purple-600 py-2">
                  Mon compte
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-gray-700 hover:text-purple-600 py-2 w-full text-left"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-gray-700 hover:text-purple-600 py-2">
                  Connexion
                </Link>
                <Link href="/create-account" className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-center">
                  S'inscrire
                </Link>
              </>
            )}
            <Link href="mailto:contact@verifiemamaison.fr" className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-center">
              Contact
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}

