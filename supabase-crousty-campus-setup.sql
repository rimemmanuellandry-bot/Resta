-- ==============================================================================
-- RESTA : AJOUT DU RESTAURANT "LE CROUSTY DU CAMPUS" ET DE SA CARTE COMPLÈTE
-- ==============================================================================
-- Exécutez ce script dans l'Éditeur SQL de votre tableau de bord Supabase :
-- (Dashboard Supabase > SQL Editor > New query > Run)
--
-- Slogan : "Manger Bien, Etudier Bien"
-- Carte complète extraite fidèlement des menus :
-- 1. Petits déjeuners salés
-- 2. Condiments & Boissons
-- 3. Repas chauds
-- 4. Compléments & Accompagnements
-- ==============================================================================

DO $$
DECLARE
    v_resto_id BIGINT;
BEGIN
    -- 1. Création ou récupération du restaurant "Le Crousty du Campus"
    SELECT id INTO v_resto_id FROM public.restaurants WHERE nom ILIKE '%crousty%' LIMIT 1;

    IF v_resto_id IS NULL THEN
        INSERT INTO public.restaurants (nom, localite, adresse, telephone, latitude, longitude)
        VALUES (
            'Le Crousty du Campus',
            'Campus',
            'Cité Universitaire, Face Campus Principal (Manger Bien, Etudier Bien)',
            '696528610 / 691715554',
            4.0535,
            9.7125
        )
        RETURNING id INTO v_resto_id;

        RAISE NOTICE 'Restaurant "Le Crousty du Campus" créé avec succès (ID: %)', v_resto_id;
    ELSE
        UPDATE public.restaurants
        SET 
            nom = 'Le Crousty du Campus',
            localite = 'Campus',
            adresse = 'Cité Universitaire, Face Campus Principal (Manger Bien, Etudier Bien)',
            telephone = '696528610 / 691715554',
            latitude = 4.0535,
            longitude = 9.7125
        WHERE id = v_resto_id;

        RAISE NOTICE 'Restaurant "Le Crousty du Campus" mis à jour (ID: %)', v_resto_id;
    END IF;

    -- 2. Suppression préventive des anciens plats de ce restaurant pour éviter les doublons
    DELETE FROM public.plats WHERE restaurant_id = v_resto_id;

    -- ==========================================================================
    -- 3. INSERTION DES 38 PLATS EXTRAITS DU MENU OFFICIEL
    -- ==========================================================================

    -- --------------------------------------------------------------------------
    -- SECTION 1 : PETITS DÉJEUNERS SALÉS
    -- --------------------------------------------------------------------------
    INSERT INTO public.plats (restaurant_id, nom, prix, categorie, description, image_url, supprime) VALUES
    (v_resto_id, 'Spaghetti Sauté', 500, 'Petits déjeuners salés', 'Plat généreux de spaghetti sautés aux oignons, petits légumes et épices du chef.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=80', false),
    (v_resto_id, 'Oeufs Simples', 200, 'Petits déjeuners salés', 'Deux oeufs cuits au plat ou brouillés à point, légèrement poivrés.', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80', false),
    (v_resto_id, '1 Oeuf + Spaghetti', 250, 'Petits déjeuners salés', 'Assiette de spaghetti sautés accompagnée d''un oeuf au plat doré.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80', false),
    (v_resto_id, '1 Oeuf + 1 Sardine', 300, 'Petits déjeuners salés', 'Un oeuf au plat savoureux servi avec une sardine entière à l''huile.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80', false),
    (v_resto_id, 'Oeufs + Spaghetti + Sardine', 350, 'Petits déjeuners salés', 'Spaghetti sautés avec un oeuf au plat et une portion de sardine à l''huile.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&q=80', false),
    (v_resto_id, '2 Oeufs + Spaghetti', 400, 'Petits déjeuners salés', 'Double portion d''oeufs au plat sur un lit de spaghetti sautés bien chauds.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=80', false),
    (v_resto_id, '2 Oeufs + Spaghetti + Sardine', 500, 'Petits déjeuners salés', 'Le grand complet du campus : deux oeufs au plat, spaghetti sautés et sardine savoureuse.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=80', false),
    (v_resto_id, 'Chocolat chaud', 100, 'Petits déjeuners salés', 'Tasse de chocolat chaud onctueux et réconfortant (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80', false);

    -- --------------------------------------------------------------------------
    -- SECTION 2 : CONDIMENTS & BOISSONS
    -- --------------------------------------------------------------------------
    INSERT INTO public.plats (restaurant_id, nom, prix, categorie, description, image_url, supprime) VALUES
    (v_resto_id, 'Beurre', 50, 'Condiments & Boissons', 'Portion individuelle de beurre doux crémeux pour tartine (à partir de 50 FCFA).', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', false),
    (v_resto_id, 'Mayonnaise', 100, 'Condiments & Boissons', 'Portion de mayonnaise crémeuse et onctueuse du chef (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=500&q=80', false),
    (v_resto_id, 'Saucisson', 100, 'Condiments & Boissons', 'Rondelles de saucisson de boeuf épicé et savoureux (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', false),
    (v_resto_id, 'Pâté', 100, 'Condiments & Boissons', 'Portion de pâté savoureux à tartiner (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&q=80', false),
    (v_resto_id, 'Tasse de lait simple', 200, 'Condiments & Boissons', 'Tasse de lait chaud velouté et crémeux.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', false),
    (v_resto_id, 'Tasse + Matinal', 200, 'Condiments & Boissons', 'Tasse de lait chaud enrichie aux céréales Matinal énergisantes.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', false),
    (v_resto_id, 'Tasse de café', 200, 'Condiments & Boissons', 'Tasse de café noir corsé ou au lait pour stimuler vos journées d''études.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80', false),
    (v_resto_id, 'Bouillie', 100, 'Condiments & Boissons', 'Bouillie traditionnelle onctueuse, douce et nourrissante (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', false),
    (v_resto_id, 'Haricot sauté', 100, 'Condiments & Boissons', 'Haricots rouges sautés aux oignons et condiments camerounais (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', false),
    (v_resto_id, 'Crêpes haché de boeuf', 100, 'Condiments & Boissons', 'Crêpe dorée farcie à la viande de boeuf hachée assaisonnée (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&q=80', false);

    -- --------------------------------------------------------------------------
    -- SECTION 3 : REPAS CHAUDS & PLATS PRINCIPAUX
    -- --------------------------------------------------------------------------
    INSERT INTO public.plats (restaurant_id, nom, prix, categorie, description, image_url, supprime) VALUES
    (v_resto_id, 'Riz Sauté', 500, 'Repas chauds', 'Riz sauté parfumé aux petits légumes croquants et fines herbes.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80', false),
    (v_resto_id, 'Poulet', 1000, 'Repas chauds', 'Morceau de poulet fermier braisé ou frit croustillant, mariné aux épices du terroir.', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&q=80', false),
    (v_resto_id, 'Poisson Bar Frit', 1000, 'Repas chauds', 'Bar entier assaisonné et frit à l''huile dorée, croustillant à l''extérieur.', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80', false),
    (v_resto_id, 'Poisson Maquereau Frit', 1000, 'Repas chauds', 'Poisson maquereau frais mariné aux aromates traditionnels et frit à point.', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80', false),
    (v_resto_id, 'Eru', 500, 'Repas chauds', 'Plat traditionnel d''Eru aux feuilles sauvages, épinards d''eau et peau de boeuf (à partir de 500 FCFA).', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', false),
    (v_resto_id, 'Okok Sucré', 500, 'Repas chauds', 'Okok traditionnel sucré préparé à la pâte d''arachide et au jus de noix de palme (à partir de 500 FCFA).', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', false),
    (v_resto_id, 'Bouillon de Viande de Boeuf', 1000, 'Repas chauds', 'Bouillon mijoté bien chaud avec morceaux tendres de boeuf et piment doux parfumé.', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80', false),
    (v_resto_id, 'Pomme Sautée', 500, 'Repas chauds', 'Pommes de terre sautées à la poêle avec oignons et persil frais (à partir de 500 FCFA).', 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=500&q=80', false),
    (v_resto_id, 'Porc', 1000, 'Repas chauds', 'Morceau de viande de porc rôti ou sauté aux oignons caramélisés et piment doux.', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80', false),
    (v_resto_id, 'Boulette de Viande', 100, 'Repas chauds', 'Boulette de viande de boeuf hachée assaisonnée et dorée à coeur (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500&q=80', false),
    (v_resto_id, 'Haché de Poisson', 100, 'Repas chauds', 'Galette de poisson haché délicatement épicée et frite (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80', false);

    -- --------------------------------------------------------------------------
    -- SECTION 4 : COMPLÉMENTS & ACCOMPAGNEMENTS
    -- --------------------------------------------------------------------------
    INSERT INTO public.plats (restaurant_id, nom, prix, categorie, description, image_url, supprime) VALUES
    (v_resto_id, 'Frites de Plantain', 200, 'Compléments', 'Portion de plantains mûrs frits (alloco), dorés et fondants en bouche.', 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500&q=80', false),
    (v_resto_id, 'Bâton de Manioc', 100, 'Compléments', 'Bobolo traditionnel enroulé en feuille de bananier et cuit à la vapeur.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', false),
    (v_resto_id, 'Tubercule de Manioc', 100, 'Compléments', 'Morceau de manioc vapeur tendre, idéal pour accompagner poissons et sauces.', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', false),
    (v_resto_id, 'Frites de Pommes de Terre', 500, 'Compléments', 'Frites croustillantes et bien dorées, servies chaudes.', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80', false),
    (v_resto_id, 'Pain', 50, 'Compléments', 'Pain chaud et croustillant pour accompagner bouillons et petits déjeuners (à partir de 50 FCFA).', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80', false),
    (v_resto_id, 'Beignets de Farine', 25, 'Compléments', 'Beignets soufflés traditionnels dorés et légers (à partir de 25 FCFA l''unité).', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', false),
    (v_resto_id, 'Beignets de Maïs', 25, 'Compléments', 'Beignets de maïs koki traditionnels frits et croustillants (à partir de 25 FCFA).', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80', false),
    (v_resto_id, 'Riz Blanc', 100, 'Compléments', 'Portion de riz blanc cuit à la vapeur en accompagnement (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80', false),
    (v_resto_id, 'Spaghetti Nature', 100, 'Compléments', 'Portion de spaghetti nature en complément pour sauces et viandes (à partir de 100 FCFA).', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=80', false);

    RAISE NOTICE '38 plats insérés avec succès pour le restaurant Le Crousty du Campus.';
END $$;
