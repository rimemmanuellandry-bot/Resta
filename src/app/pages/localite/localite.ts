import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-localite',
  imports: [CommonModule],
  templateUrl: './localite.html',
  styleUrl: './localite.css',
})
export class Localite implements OnInit {
  localites: string[] = [];
  chargementTermine = false;
  intention: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
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

  choisirLocalite(localite: string) {
    const queryParams: any = { localite };
    if (this.intention) {
      queryParams.intention = this.intention;
    }
    this.router.navigate(['/restaurant'], { queryParams });
  }
}