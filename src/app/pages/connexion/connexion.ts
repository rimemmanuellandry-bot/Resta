import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { supabase } from '../../supabase';
import { AuthErreursService } from '../../services/auth-erreurs';

@Component({
  selector: 'app-connexion',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './connexion.html',
  styleUrl: './connexion.css',
})
export class Connexion implements OnInit {
  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;
  afficherMotDePasse = false;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authErreurs: AuthErreursService
  ) {}

  async ngOnInit() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const { data: admin } = await supabase
        .from('admins')
        .select('restaurant_id')
        .eq('user_id', data.session.user.id)
        .single();

      if (admin) {
        this.router.navigate(['/admin'], { queryParams: { restaurant_id: admin.restaurant_id } });
      } else {
        this.router.navigate(['/bienvenue']);
      }
    }
  }

  async seConnecter() {
    this.erreur = '';

    if (!this.email.trim() || !this.motDePasse) {
      this.erreur = this.translate.instant('connexion.erreurChampsRequis');
      return;
    }

    this.chargement = true;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.motDePasse,
    });

    if (error) {
      this.chargement = false;
      this.erreur = this.authErreurs.traduire(error.message);
      return;
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('restaurant_id')
      .eq('user_id', data.user.id)
      .single();

    this.chargement = false;

    if (admin) {
      this.router.navigate(['/admin'], { queryParams: { restaurant_id: admin.restaurant_id } });
    } else {
      this.router.navigate(['/bienvenue']);
    }
  }
}