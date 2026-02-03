'use client';

import Container from '../Container';
import Link from 'next/link';

export default function HomeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2 pr-12">
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight mb-6 block">
              VerifieMaMaison<span className="text-emerald-500">.</span>
            </Link>
            <p className="text-gray-500 text-sm font-light leading-relaxed max-w-sm">
              L'intelligence artificielle au service de la transparence immobilière.
              Nous donnons le pouvoir aux acheteurs grâce à la data.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">Plateforme</h4>
            <ul className="space-y-4">
              <li><Link href="/tarifs" className="text-sm text-gray-500 hover:text-black transition-colors">Tarifs</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-black transition-colors">Connexion</Link></li>
              <li><Link href="/create-account" className="text-sm text-gray-500 hover:text-black transition-colors">S'inscrire</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-6">Légal</h4>
            <ul className="space-y-4">
              <li><Link href="/legal" className="text-sm text-gray-500 hover:text-black transition-colors">Mentions légales</Link></li>
              <li><Link href="/cgv" className="text-sm text-gray-500 hover:text-black transition-colors">CGV</Link></li>
              <li><Link href="mailto:contact@verifiemamaison.fr" className="text-sm text-gray-500 hover:text-black transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-mono">
            © {currentYear} VerifieMaMaison Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-400 font-mono">System Normal</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
