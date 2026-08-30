import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PanierService, Plat } from '../../services/panier';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-menu',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  plats: Plat[] = [];
  table: string | null = null;
  categories: { nom: string; plats: Plat[] }[] = [];
  chargementTermine = false;
  recherche = '';

  constructor(
    public panierService: PanierService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    let restaurantId: string | null = null;

    this.route.queryParams.subscribe(params => {
      this.table = params['table'] || null;
      if (this.table) {
        this.panierService.setTable(this.table);
      }

      restaurantId = params['restaurant_id'] || null;
      if (restaurantId) {
        this.panierService.restaurantId = restaurantId;
      }

      if (params['mode'] === 'livraison') {
        this.panierService.mode = 'livraison';
      } else {
        this.panierService.mode = 'sur_place';
      }
    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let requete = supabase.from('plats').select('*').eq('supprime', false);

    if (restaurantId) {
      requete = requete.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await requete;
    if (error) {
      console.error('Erreur lors du chargement des plats :', error);
    } else {
      this.plats = data as Plat[];
      this.groupePlatsParCategorie();
      this.chargementTermine = true;
      this.cdr.detectChanges();
    }
  }

  groupePlatsParCategorie() {
    const groupes = new Map<string, Plat[]>();

    for (const plat of this.plats) {
      const cle = plat.categorie || 'Autres';
      if (!groupes.has(cle)) {
        groupes.set(cle, []);
      }
      groupes.get(cle)!.push(plat);
    }

    this.categories = Array.from(groupes.entries()).map(([nom, plats]) => ({ nom, plats }));
  }

  get categoriesAffichees() {
    if (!this.recherche.trim()) {
      return this.categories;
    }
    const terme = this.recherche.trim().toLowerCase();
    return this.categories
      .map(cat => ({
        nom: cat.nom,
        plats: cat.plats.filter(p => p.nom.toLowerCase().includes(terme)),
      }))
      .filter(cat => cat.plats.length > 0);
  }

  ajouterAuPanier(plat: Plat) {
    this.panierService.ajouter(plat);
  }
}