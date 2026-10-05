-- ==============================================================================
-- DÉBLOCAGE COMPLET DES DROITS SUR LES RÉSERVATIONS ET ÉVÉNEMENTS (ADMIN)
-- ==============================================================================
-- Exécutez ce script dans l'Éditeur SQL de votre tableau de bord Supabase :
-- (Dashboard Supabase > SQL Editor > New query > Run)

-- 1. S'assurer que le RLS est activé
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_evenement ENABLE ROW LEVEL SECURITY;

-- 2. Nettoyer les anciennes politiques restrictives sur les réservations
DROP POLICY IF EXISTS "Admins peuvent modifier les reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins peuvent supprimer les reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins peuvent lire les reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins et clients peuvent lire les reservations" ON public.reservations;
DROP POLICY IF EXISTS "Tout le monde peut inserer des reservations" ON public.reservations;
DROP POLICY IF EXISTS "Lecture des reservations" ON public.reservations;
DROP POLICY IF EXISTS "Insertion des reservations" ON public.reservations;
DROP POLICY IF EXISTS "Modification des reservations par admins" ON public.reservations;
DROP POLICY IF EXISTS "Suppression des reservations par admins" ON public.reservations;

-- 3. Nouvelles politiques complètes et débloquées pour 'reservations'

-- A) LECTURE : clients (leurs propres réservations) et admins
CREATE POLICY "Lecture des reservations" ON public.reservations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );

-- B) INSERTION : les clients peuvent créer des réservations
CREATE POLICY "Insertion des reservations" ON public.reservations
    FOR INSERT
    TO public
    WITH CHECK (true);

-- C) MODIFICATION (Confirmer / Refuser) : réservée aux admins
CREATE POLICY "Modification des reservations par admins" ON public.reservations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );

-- D) SUPPRESSION : réservée aux admins
CREATE POLICY "Suppression des reservations par admins" ON public.reservations
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );

-- ==============================================================================
-- 4. Même déblocage pour les demandes d'événements
-- ==============================================================================
DROP POLICY IF EXISTS "Lecture des evenements" ON public.demandes_evenement;
DROP POLICY IF EXISTS "Insertion des evenements" ON public.demandes_evenement;
DROP POLICY IF EXISTS "Modification des evenements par admins" ON public.demandes_evenement;
DROP POLICY IF EXISTS "Suppression des evenements par admins" ON public.demandes_evenement;

CREATE POLICY "Lecture des evenements" ON public.demandes_evenement
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );

CREATE POLICY "Insertion des evenements" ON public.demandes_evenement
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Modification des evenements par admins" ON public.demandes_evenement
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );

CREATE POLICY "Suppression des evenements par admins" ON public.demandes_evenement
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
    );
