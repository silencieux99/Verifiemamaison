'use client';

import { useAuth } from '@/app/(context)/AuthContext';

/**
 * Composant pour ajouter les données structurées JSON-LD pour le SEO
 */
export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.verifiemamaison.fr';
  
  // Schema.org Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "VerifieMaMaison.fr",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.png`,
    "description": "Service d'analyse immobilière complète en ligne",
    "sameAs": [
      "https://www.facebook.com/verifiemamaison",
      "https://twitter.com/VerifieMaMaison",
      "https://www.linkedin.com/company/verifiemamaison"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "contact@verifiemamaison.fr"
    }
  };

  // Schema.org Service
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Analyse Immobilière",
    "provider": {
      "@type": "Organization",
      "name": "VerifieMaMaison.fr"
    },
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "description": "Analyse complète de biens immobiliers avec rapport détaillé incluant risques naturels, DPE, marché immobilier, écoles, commodités et recommandations IA",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }
  };

  // Schema.org WebSite
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "VerifieMaMaison.fr",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/generate-report?address={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

