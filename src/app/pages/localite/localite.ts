import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { supabase } from '../../supabase';
import { GeoService } from '../../services/geo';

@Component({
  selector: 'app-localite',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './localite.html',
  styleUrl: './localite.css',
})
export class Localite implements OnInit {
  localites: string[] = [];
  chargementTermine = false;
  intention: string | null = null;
  gpsEnCours = false;
  erreurGps: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private geoService: GeoService
  ) {}

  async ngOnInit() {
    this.intention = this.route.snapshot.queryParams['intention'] || null;

    const { data, error } = await supabase.from('restaurants').select('localite');

    if (error) {
      console.error('Erreur lors du chargement des localités :', error);
      return;
    }

    this.localites = [...new Set((data as { localite: string }[]).map(r => r.localite))];
    this.chargementTermine = true;
    this.cdr.detectChanges();
  }

  async localiserGps() {
    this.gpsEnCours = true;
    this.erreurGps = null;
    this.cdr.detectChanges();

    try {
      const coords = await this.geoService.obtenirPositionActuelle();
      const queryParams: any = {
        gps: '1',
        lat: coords.latitude,
        lng: coords.longitude,
      };
      if (this.intention) {
        queryParams.intention = this.intention;
      }
      this.router.navigate(['/restaurant'], { queryParams });
    } catch (err: any) {
      console.warn('Erreur GPS :', err);
      this.erreurGps = 'localite.erreurGps';
    } finally {
      this.gpsEnCours = false;
      this.cdr.detectChanges();
    }
  }

  choisirLocalite(localite: string) {
    const queryParams: any = { localite };
    if (this.intention) {
      queryParams.intention = this.intention;
    }
    this.router.navigate(['/restaurant'], { queryParams });
  }
}