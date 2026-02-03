'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Container from './Container';
import { CreditsDisplay } from './CreditsDisplay';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { firebaseUser, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 relative group" aria-label="VerifieMaMaison.fr - Accueil">
          <div className="relative h-10 w-auto">
            {/* Logo sans inversion pour le thème clair */}
            <Image
              src="/logos/logo.png"
              alt="VerifieMaMaison"
              width={160}
              height={50}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden lg:flex items-center space-x-1" role="navigation">
          <CreditsDisplay />

          <div className="flex items-center px-4 space-x-8">
            <Link
              href="/tarifs"
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/checkout"
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Crédits
            </Link>
            {firebaseUser && (
              <Link
                href="/account"
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Mon compte
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
            {firebaseUser ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Déconnexion
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-black px-4 py-2 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/create-account"
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-[#0A0A0A] rounded-full hover:bg-gray-800 hover:scale-105 focus:outline-none"
                >
                  <span className="relative">S'inscrire</span>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Menu mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-900 p-2"
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
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <Container className="py-6 space-y-4">
              <CreditsDisplay />
              <Link href="/tarifs" className="block text-base font-medium text-gray-600 hover:text-black py-2">
                Tarifs
              </Link>
              <Link href="/checkout" className="block text-base font-medium text-gray-600 hover:text-black py-2">
                Acheter des packs
              </Link>
              {firebaseUser ? (
                <>
                  <Link href="/account" className="block text-base font-medium text-gray-600 hover:text-black py-2">
                    Mon compte
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-base font-medium text-gray-600 hover:text-black py-2 w-full text-left"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-base font-medium text-gray-600 hover:text-black py-2">
                    Connexion
                  </Link>
                  <Link href="/create-account" className="block w-full text-center bg-black hover:bg-gray-800 text-white font-semibold px-4 py-3 rounded-xl transition-all">
                    Commencer l'analyse
                  </Link>
                </>
              )}
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
