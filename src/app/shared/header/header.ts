import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  estConnecte = false;
  estAdmin = false;
  restaurantId: string | null = null;
  afficherRetour = false;

  private pagesSansRetour = ['/', '/bienvenue'];
  private navigationsInternes = 0;
  private premiereNavigation = true;

  constructor(private router: Router, private location: Location) {}

  ngOnInit() {
    this.majAffichageRetour(this.location.path());

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        if (this.premiereNavigation) {
          this.premiereNavigation = false;
        } else {
          this.navigationsInternes++;
        }
        this.majAffichageRetour(e.urlAfterRedirects);
      });

    this.verifierSession();

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.verifierSession();
      } else {
        this.estConnecte = false;
        this.estAdmin = false;
        this.restaurantId = null;
      }
    });
  }

  private async verifierSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      this.estConnecte = false;
      this.estAdmin = false;
      return;
    }

    this.estConnecte = true;

    const { data: admin } = await supabase
      .from('admins')
      .select('restaurant_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (admin) {
      this.estAdmin = true;
      this.restaurantId = admin.restaurant_id;
    } else {
      this.estAdmin = false;
      this.restaurantId = null;
    }
  }

  private majAffichageRetour(url: string) {
    const chemin = url.split('?')[0];
    this.afficherRetour = !this.pagesSansRetour.includes(chemin);
  }

  retour() {
    if (this.navigationsInternes > 0) {
      this.location.back();
      return;
    }

    const chemin = this.router.url.split('?')[0];

    if (chemin === '/statistiques' && this.restaurantId) {
      this.router.navigate(['/admin'], { queryParams: { restaurant_id: this.restaurantId } });
      return;
    }

    this.router.navigate(['/bienvenue']);
  }

  async seDeconnecter() {
    await supabase.auth.signOut();
    this.estConnecte = false;
    this.estAdmin = false;
    this.router.navigate(['/']);
  }
}