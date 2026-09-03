import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-connexion',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './connexion.html',
  styleUrl: './connexion.css',
})
export class Connexion implements OnInit {
  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;
  afficherMotDePasse = false;

  constructor(private router: Router) {}

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
      this.erreur = 'Email et mot de passe sont obligatoires.';
      return;
    }

    this.chargement = true;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.motDePasse,
    });

    if (error) {
      this.chargement = false;
      this.erreur = 'Email ou mot de passe incorrect.';
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