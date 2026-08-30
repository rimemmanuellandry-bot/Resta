import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../supabase';

interface RestaurantInfo {
  id: number;
  nom: string;
  localite: string;
  adresse: string;
  telephone: string;
}

@Component({
  selector: 'app-restaurant',
  imports: [CommonModule],
  templateUrl: './restaurant.html',
  styleUrl: './restaurant.css',
})
export class Restaurant implements OnInit {
  restaurants: RestaurantInfo[] = [];
  localite: string | null = null;
  intention: string | null = null;
  chargementTermine = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      this.localite = params['localite'] || null;
      this.intention = params['intention'] || null;

      if (!this.localite) {
        this.chargementTermine = true;
        this.cdr.detectChanges();
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('localite', this.localite);

      if (error) {
        console.error('Erreur lors du chargement des restaurants :', error);
        return;
      }

      this.restaurants = data as RestaurantInfo[];
      this.chargementTermine = true;
      this.cdr.detectChanges();
    });
  }

 choisirRestaurant(restaurant: RestaurantInfo) {
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