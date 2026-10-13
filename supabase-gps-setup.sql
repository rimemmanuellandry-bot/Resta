-- ==============================================================================
-- RESTA : CONFIGURATION GPS ET GÉOLOCALISATION DES RESTAURANTS
-- ==============================================================================
-- Exécutez ce script dans l'Éditeur SQL de votre tableau de bord Supabase :
-- (Dashboard Supabase > SQL Editor > New query > Run)

-- 1. Ajout des colonnes latitude et longitude si elles n'existent pas
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Création d'index pour les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_restaurants_coords ON public.restaurants(latitude, longitude);

-- 3. Mise à jour des coordonnées GPS de démonstration pour les restaurants existants
-- (Coordonnées réalistes de Douala et Yaoundé)
UPDATE public.restaurants
SET latitude = 4.0511, longitude = 9.7085
WHERE localite ILIKE '%douala%' AND (latitude IS NULL OR longitude IS NULL);

UPDATE public.restaurants
SET latitude = 3.8767, longitude = 11.5174
WHERE localite ILIKE '%yaounde%' AND (latitude IS NULL OR longitude IS NULL);

-- Si aucun restaurant n'a de coordonnées, initialiser le premier restaurant avec des coordonnées par défaut
UPDATE public.restaurants
SET latitude = 4.0511, longitude = 9.7085
WHERE latitude IS NULL AND longitude IS NULL;
