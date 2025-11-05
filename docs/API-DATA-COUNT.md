# Analyse des données retournées par l'API House Profile

## 📊 Résumé global

Pour **une adresse**, l'API retourne un JSON structuré avec :

### Nombre de sections principales : **14**

1. `query` - Paramètres de la requête
2. `location` - Géocodage et coordonnées
3. `risks` - Risques naturels et technologiques
4. `urbanism` - PLU et urbanisme
5. `energy` - DPE (Diagnostic de Performance Énergétique)
6. `market` - Transactions immobilières (DVF)
7. `building` - Informations du bâtiment (déclaratives)
8. `education` - Écoles à proximité
9. `connectivity` - Connectivité internet
10. `air_quality` - Qualité de l'air
11. `amenities` - Commodités (supermarchés, transports, parcs)
12. `safety` - Sécurité/délinquance (niveau communal)
13. `recommendations` - Recommandations IA
14. `meta` - Métadonnées (sources, temps, avertissements)

---

## 🔍 Détail par section

### 1. `query` (3 champs)
- `address` : string
- `radius_m` : number
- `lang` : "fr" | "en"

**Total : 3 champs**

---

### 2. `location` (~10-15 champs)
- `normalized_address` : string
- `gps.lat` : number
- `gps.lon` : number
- `admin.city` : string
- `admin.postcode` : string
- `admin.citycode` : string
- `admin.department` : string (optionnel)
- `admin.region` : string (optionnel)
- `admin.iris` : string (optionnel)
- `raw` : objet complet de l'API Adresse (~50-100 champs bruts)

**Total : ~10-15 champs normalisés + ~50-100 champs dans `raw`**

---

### 3. `risks` (~20-30 champs)
- `flood` : objet complet GéoRisques (~10-15 champs)
- `seismicity` : objet (~5-10 champs)
- `clay_shrink_swell` : objet (~5-10 champs)
- `radon` : objet (~5-10 champs)
- `ground_movements` : objet (~5-10 champs)
- `cavities` : objet (~5-10 champs)
- `wildfire` : objet (~5-10 champs)
- `polluted_lands` : objet BASOL/BASIAS/SIS (~10-20 champs)
- `normalized.flood_level` : string
- `normalized.seismic_level` : number
- `normalized.radon_zone` : 1 | 2 | 3
- `normalized.notes` : string[]

**Total : ~20-30 champs normalisés + ~60-100 champs dans les objets `raw`**

---

### 4. `urbanism` (~10-20 champs)
- `zoning[]` : Array (1-5 éléments typiquement)
  - Chaque élément : `code`, `label`, `doc_url`
- `land_servitudes[]` : Array (0-10 éléments)
  - Chaque élément : `code`, `label`, `doc_url`
- `docs[]` : Array (0-5 éléments)
  - Chaque élément : `title`, `url`
- `raw` : objet complet GPU (~50-100 champs)

**Total : ~10-20 champs normalisés + ~50-100 champs dans `raw`**

---

### 5. `energy` (~10-15 champs)
- `dpe.id` : string
- `dpe.class_energy` : "A" | "B" | "C" | "D" | "E" | "F" | "G"
- `dpe.class_ges` : string
- `dpe.date` : string
- `dpe.surface_m2` : number
- `dpe.housing_type` : string
- `dpe.raw` : objet complet DPE (~20-30 champs bruts)

**Total : ~10-15 champs normalisés + ~20-30 champs dans `raw`**

---

### 6. `market` (~50-200 champs selon transactions)
- `dvf.transactions[]` : Array (0-20 éléments typiquement)
  - Chaque transaction : `date`, `type`, `surface_m2`, `price_eur`, `price_m2_eur`, `address_hint`, `raw` (~10-15 champs)
- `dvf.summary.price_m2_median_1y` : number
- `dvf.summary.price_m2_median_3y` : number
- `dvf.summary.volume_3y` : number
- `dvf.summary.trend_label` : "hausse" | "baisse" | "stable" | null
- `dvf.raw` : données brutes DVF

**Total : ~50-200 champs** (variable selon nombre de transactions)

---

### 7. `building` (~10 champs)
- `declared.property_type` : string
- `declared.surface_habitable_m2` : number
- `declared.rooms` : number
- `declared.floors` : number
- `declared.year_built` : number
- `declared.roof_type` : string
- `declared.insulation` : string
- `declared.electrical` : string
- `declared.plumbing` : string

**Total : ~10 champs** (rempli côté front par formulaire utilisateur)

---

### 8. `education` (~50-150 champs selon écoles)
- `schools[]` : Array (0-10 éléments typiquement)
  - Chaque école : `name`, `kind`, `public_private`, `address`, `postcode`, `city`, `phone`, `website`, `gps.lat`, `gps.lon`, `distance_m`, `raw` (~15-20 champs)

**Total : ~50-150 champs** (variable selon nombre d'écoles)

---

### 9. `connectivity` (~10-15 champs)
- `fiber_available` : boolean
- `down_max_mbps` : number
- `up_max_mbps` : number
- `technologies[]` : string[]
- `raw` : objet complet ARCEP (~20-30 champs)

**Total : ~10-15 champs normalisés + ~20-30 champs dans `raw`**

---

### 10. `air_quality` (~5-10 champs)
- `index_today` : number | string
- `label` : string
- `raw` : objet complet ATMO (~10-20 champs)

**Total : ~5-10 champs normalisés + ~10-20 champs dans `raw`**

---

### 11. `amenities` (~50-200 champs selon commodités)
- `supermarkets[]` : Array (0-5 éléments)
  - Chaque élément : `name`, `distance_m`, `gps.lat`, `gps.lon`, `raw`
- `transit[]` : Array (0-5 éléments)
  - Chaque élément : `name`, `type`, `distance_m`, `gps.lat`, `gps.lon`, `raw`
- `parks[]` : Array (0-5 éléments)
  - Chaque élément : `name`, `distance_m`, `gps.lat`, `gps.lon`, `raw`
- `others[]` : Array (0-10 éléments)
  - Chaque élément : `category`, `name`, `distance_m`, `gps.lat`, `gps.lon`, `raw`

**Total : ~50-200 champs** (variable selon nombre de commodités)

---

### 12. `safety` (~30-100 champs selon indicateurs)
- `scope` : "commune"
- `city` : string
- `citycode` : string
- `period.from` : string
- `period.to` : string
- `indicators[]` : Array (3-10 éléments typiquement)
  - Chaque indicateur : `category`, `total_10y`, `rate_local_per_10k`, `rate_national_per_10k`, `level_vs_national`, `series[]` (10-15 valeurs par série)
- `notes[]` : string[]
- `raw` : données brutes SSMSI (~50-100 champs)

**Total : ~30-100 champs** (variable selon nombre d'indicateurs)

---

### 13. `recommendations` (~10-20 champs)
- `summary` : string (1-2 phrases)
- `items[]` : Array (0-5 éléments typiquement)
  - Chaque item : `title`, `reason`, `priority`, `related_sections[]`

**Total : ~10-20 champs**

---

### 14. `meta` (~10-20 champs)
- `generated_at` : string (ISO timestamp)
- `processing_ms` : number
- `sources[]` : Array (5-15 éléments typiquement)
  - Chaque source : `section`, `url`, `fetched_at`
- `warnings[]` : string[] (0-5 éléments)

**Total : ~10-20 champs**

---

## 📈 **TOTAL ESTIMÉ**

### Champs normalisés (hors raw) : **~200-300 champs**

### Champs bruts (dans raw) : **~300-500 champs**

### **TOTAL GLOBAL : ~500-800 champs** pour une adresse

---

## 📏 Taille de la réponse JSON

### Format minifié (sans espaces)
- **Minimum** : ~15-20 KB (peu de données disponibles)
- **Typique** : ~30-50 KB (données moyennes)
- **Maximum** : ~100-200 KB (beaucoup de transactions, écoles, commodités)

### Format indenté (lisible)
- **Minimum** : ~50-100 lignes
- **Typique** : ~200-400 lignes
- **Maximum** : ~500-1000 lignes

---

## 🔢 Exemple concret

Pour une adresse typique avec :
- ✅ Géocodage complet
- ✅ 5-8 risques identifiés
- ✅ PLU avec 2-3 zones
- ✅ DPE présent
- ✅ 10-15 transactions DVF
- ✅ 5-8 écoles
- ✅ Fibre disponible
- ✅ Qualité air OK
- ✅ 10-15 commodités
- ✅ 5-8 indicateurs sécurité
- ✅ 3-5 recommandations

**Résultat** : 
- **~400-600 champs** au total
- **~300-500 lignes** en JSON indenté
- **~40-60 KB** en JSON minifié

---

## 📝 Notes importantes

1. **Champs `raw`** : Chaque section contient un objet `raw` avec les données brutes complètes des APIs sources. Ces objets peuvent être très volumineux.

2. **Variabilité** : Le nombre exact de champs dépend de :
   - La disponibilité des données pour l'adresse
   - Le nombre de transactions DVF à proximité
   - Le nombre d'écoles dans le rayon
   - Le nombre de commodités trouvées
   - Les risques identifiés

3. **Optimisation** : Si besoin de réduire la taille, on peut :
   - Limiter le nombre de transactions DVF (actuellement 20 max)
   - Limiter le nombre d'écoles (actuellement 10 max)
   - Limiter les commodités (actuellement 5 par catégorie)
   - Exclure certains objets `raw` si non nécessaires

4. **Compression** : Le JSON peut être compressé avec gzip côté serveur (Next.js le fait automatiquement).

---

## 🎯 Conclusion

Pour **une seule adresse**, l'API retourne :
- **~500-800 champs** d'informations
- **~200-500 lignes** de JSON indenté
- **~30-60 KB** de données (minifié, compressé ~10-20 KB)

C'est une **très riche agrégation** de données provenant de **11 sources différentes** !

