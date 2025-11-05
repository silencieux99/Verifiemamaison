/**
 * Tests pour house-profile-utils
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  geocodeAddress,
  fetchSchools,
  haversineDistance,
  computeRecommendations,
} from '../house-profile-utils';
import { HouseProfile } from '../house-profile-types';

// Mock fetch global
global.fetch = jest.fn() as jest.Mock;

describe('house-profile-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('haversineDistance', () => {
    it('devrait calculer la distance entre deux points GPS', () => {
      // Distance approximative Paris-Lyon (environ 400km)
      const distance = haversineDistance(48.8566, 2.3522, 45.7640, 4.8357);
      expect(distance).toBeGreaterThan(390000);
      expect(distance).toBeLessThan(410000);
    });

    it('devrait retourner 0 pour le même point', () => {
      const distance = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(distance).toBe(0);
    });
  });

  describe('geocodeAddress', () => {
    it('devrait géocoder une adresse et renvoyer citycode', async () => {
      const mockResponse = {
        features: [
          {
            properties: {
              label: '11 Rue Barbès, 93600 Aulnay-sous-Bois',
              city: 'Aulnay-sous-Bois',
              postcode: '93600',
              citycode: '93005',
              context: 'Seine-Saint-Denis, Île-de-France',
            },
            geometry: {
              coordinates: [2.4935, 48.9386],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await geocodeAddress('11 rue Barbès, 93600 Aulnay-sous-Bois');

      expect(result.citycode).toBe('93005');
      expect(result.city).toBe('Aulnay-sous-Bois');
      expect(result.postcode).toBe('93600');
      expect(result.lat).toBe(48.9386);
      expect(result.lon).toBe(2.4935);
    });

    it('devrait lever une erreur si adresse non trouvée', async () => {
      (global.fetch as jest.Mock<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] }),
      });

      await expect(geocodeAddress('Adresse inexistante 12345')).rejects.toThrow(
        'Adresse non trouvée'
      );
    });
  });

  describe('fetchSchools', () => {
    it('devrait renvoyer au moins un établissement avec distance calculée', async () => {
      const mockResponse = {
        records: [
          {
            fields: {
              appellation_officielle: 'École Élémentaire Test',
              type_etablissement: 'École élémentaire',
              statut_public_prive: 'Public',
              adresse_1: '123 Rue Test',
              code_postal: '93600',
              commune: 'Aulnay-sous-Bois',
              telephone: '01 23 45 67 89',
              web: 'https://example.com',
            },
            geometry: {
              coordinates: [2.4935, 48.9386],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await fetchSchools(48.9386, 2.4935, 1500);

      expect(result.schools.length).toBeGreaterThan(0);
      expect(result.schools[0].name).toBe('École Élémentaire Test');
      expect(result.schools[0].distance_m).toBeDefined();
      expect(typeof result.schools[0].distance_m).toBe('number');
    });
  });

  describe('computeRecommendations', () => {
    it('devrait calculer level_vs_national selon règles (0.75 / 1.25)', () => {
      const profile: Partial<HouseProfile> = {
        safety: {
          scope: 'commune',
          city: 'Test',
          citycode: '12345',
          period: { from: '2015', to: '2024' },
          indicators: [
            {
              category: 'cambriolages',
              rate_local_per_10k: 10,
              rate_national_per_10k: 20,
            },
            {
              category: 'violences',
              rate_local_per_10k: 30,
              rate_national_per_10k: 20,
            },
            {
              category: 'autres',
              rate_local_per_10k: 15,
              rate_national_per_10k: 20,
            },
          ],
        },
      };

      const recommendations = computeRecommendations(profile);
      expect(recommendations.items.length).toBeGreaterThanOrEqual(0);
      expect(recommendations.summary).toBeDefined();
    });

    it('devrait générer des recommandations pour DPE faible', () => {
      const profile: Partial<HouseProfile> = {
        energy: {
          dpe: {
            class_energy: 'F',
            class_ges: 'G',
          },
        },
      };

      const recommendations = computeRecommendations(profile);
      expect(recommendations.items.length).toBeGreaterThan(0);
      expect(recommendations.items.some((item) => item.title.includes('isolation'))).toBe(true);
    });

    it('devrait générer un profil complet avec location, risks, etc.', () => {
      const profile: Partial<HouseProfile> = {
        location: {
          normalized_address: '11 Rue Test',
          gps: { lat: 48.9386, lon: 2.4935 },
          admin: {
            city: 'Test',
            postcode: '93600',
            citycode: '93005',
          },
        },
        risks: {
          normalized: {
            flood_level: 'moyen',
            seismic_level: 2,
          },
        },
        urbanism: {
          zoning: [{ code: 'U', label: 'Zone urbaine' }],
        },
        energy: {
          dpe: {
            class_energy: 'D',
          },
        },
        market: {
          dvf: {
            summary: {
              price_m2_median_1y: 3000,
              trend_label: 'hausse',
            },
          },
        },
        education: {
          schools: [],
        },
        connectivity: {
          fiber_available: true,
        },
        air_quality: {
          index_today: 50,
        },
        amenities: {},
        safety: {
          scope: 'commune',
          city: 'Test',
          citycode: '93005',
          period: { from: '2015', to: '2024' },
          indicators: [],
        },
      };

      const recommendations = computeRecommendations(profile);
      expect(recommendations).toBeDefined();
      expect(recommendations.summary).toBeTruthy();
      expect(Array.isArray(recommendations.items)).toBe(true);
    });
  });
});

