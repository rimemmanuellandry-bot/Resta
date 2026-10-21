import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { supabase } from '../../supabase';
import { GeoService } from '../../services/geo';

export interface RestaurantInfo {
  id: number;
  nom: string;
  localite: string;
  adresse: string;
  telephone: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  distanceAffichee?: string | null;
}

@Component({
  selector: 'app-restaurant',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './restaurant.html',
  styleUrl: './restaurant.css',
})
export class Restaurant implements OnInit {
  restaurants: RestaurantInfo[] = [];
  localite: string | null = null;
  intention: string | null = null;
  chargementTermine = false;

  modeGps = false;
  clientLat: number | null = null;
  clientLng: number | null = null;
  chargementGps = false;
  erreurGps: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private geoService: GeoService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.localite = params['localite'] || null;
      this.intention = params['intention'] || null;
      this.modeGps = params['gps'] === '1';

      if (params['lat'] && params['lng']) {
        this.clientLat = parseFloat(params['lat']);
        this.clientLng = parseFloat(params['lng']);
      }

      this.chargementTermine = false;
      this.cdr.detectChanges();

      let query = supabase.from('restaurants').select('*');

      if (this.localite && !this.modeGps) {
        query = query.eq('localite', this.localite);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des restaurants :', error);
        this.chargementTermine = true;
        this.cdr.detectChanges();
        return;
      }

      const liste = (data || []) as RestaurantInfo[];

      // Si le mode GPS est activé, calculer la distance et trier
      if (this.modeGps && this.clientLat != null && this.clientLng != null) {
        this.appliquerCalculsDistance(liste);
      } else {
        this.restaurants = liste;
      }

      this.chargementTermine = true;
      this.cdr.detectChanges();
    });
  }

  private appliquerCalculsDistance(liste: RestaurantInfo[]) {
    if (this.clientLat == null || this.clientLng == null) return;

    for (const r of liste) {
      if (r.latitude != null && r.longitude != null) {
        const d = this.geoService.calculerDistanceKm(
          this.clientLat,
          this.clientLng,
          Number(r.latitude),
          Number(r.longitude)
        );
        r.distanceKm = d;
        r.distanceAffichee = this.geoService.formaterDistance(d);
      } else {
        r.distanceKm = 999999;
        r.distanceAffichee = null;
      }
    }

    // Trier du plus proche au plus éloigné
    this.restaurants = liste.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
  }

  async activerTriGps() {
    this.chargementGps = true;
    this.erreurGps = null;
    this.cdr.detectChanges();

    try {
      const coords = await this.geoService.obtenirPositionActuelle();
      this.clientLat = coords.latitude;
      this.clientLng = coords.longitude;
      this.modeGps = true;

      this.appliquerCalculsDistance(this.restaurants);
    } catch (err: any) {
      console.warn('Erreur géolocalisation :', err);
      this.erreurGps = 'restaurant.erreurGps';
    } finally {
      this.chargementGps = false;
      this.cdr.detectChanges();
    }
  }

  choisirRestaurant(restaurant: RestaurantInfo) {
    this.panierService.restaurantId = String(restaurant.id);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('resta_selected_restaurant_id', String(restaurant.id));
    }
    if (this.intention === 'reservation') {
      this.router.navigate(['/reservation'], {
        queryParams: { restaurant_id: restaurant.id },
      });
    } else if (this.intention === 'evenement') {
      this.router.navigate(['/evenement'], {
        queryParams: { restaurant_id: restaurant.id },
      });
    } else {
      this.router.navigate(['/menu'], {
        queryParams: { restaurant_id: restaurant.id, mode: 'livraison' },
      });
    }
  }
}