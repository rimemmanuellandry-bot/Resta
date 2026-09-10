import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { supabase } from '../../supabase';
import { AuthErreursService } from '../../services/auth-erreurs';

@Component({
  selector: 'app-inscription',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class Inscription {
  nom = '';
  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;
  afficherMotDePasse = false;

  erreurNom = '';
  erreurEmail = '';
  erreurMotDePasse = '';

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authErreurs: AuthErreursService
  ) {}

  validerNom(): boolean {
    if (!this.nom.trim()) {
      this.erreurNom = this.translate.instant('inscription.erreurNomRequis');
      return false;
    }
    this.erreurNom = '';
    return true;
  }

  validerEmail(): boolean {
    if (!this.email.trim()) {
      this.erreurEmail = this.translate.instant('inscription.erreurEmailRequis');
      return false;
    }
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(this.email)) {
      this.erreurEmail = this.translate.instant('inscription.erreurEmailInvalide');
      return false;
    }
    this.erreurEmail = '';
    return true;
  }

  validerMotDePasse(): boolean {
    if (!this.motDePasse) {
      this.erreurMotDePasse = this.translate.instant('inscription.erreurMotDePasseRequis');
      return false;
    }
    if (this.motDePasse.length < 9) {
      this.erreurMotDePasse = this.translate.instant('inscription.erreurMotDePasseCourt');
      return false;
    }
    const aMinuscule = /[a-z]/.test(this.motDePasse);
    const aMajuscule = /[A-Z]/.test(this.motDePasse);
    const aChiffre = /\d/.test(this.motDePasse);
    const aSymbole = /[^A-Za-z0-9]/.test(this.motDePasse);

    if (!aMinuscule || !aMajuscule || !aChiffre || !aSymbole) {
      this.erreurMotDePasse = this.translate.instant('inscription.erreurMotDePasseComplexite');
      return false;
    }

    this.erreurMotDePasse = '';
    return true;
  }

  async sInscrire() {
    this.erreur = '';

    const nomValide = this.validerNom();
    const emailValide = this.validerEmail();
    const motDePasseValide = this.validerMotDePasse();

    if (!nomValide || !emailValide || !motDePasseValide) {
      this.erreur = this.translate.instant('inscription.erreurChampsSignales');
      return;
    }

    this.chargement = true;

    const { data, error } = await supabase.auth.signUp({
      email: this.email,
      password: this.motDePasse,
      options: {
        data: { nom: this.nom },
      },
    });

    this.chargement = false;

    if (error) {
      this.erreur = this.authErreurs.traduire(error.message);
      return;
    }

    this.router.navigate(['/bienvenue']);
  }
}