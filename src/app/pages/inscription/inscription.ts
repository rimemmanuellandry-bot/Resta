import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-inscription',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class Inscription {
  nom = '';
  email = '';
  motDePasse = '';
  erreur = '';
  chargement = false;

  // erreurs par champ, affichées sous chaque input
  erreurNom = '';
  erreurEmail = '';
  erreurMotDePasse = '';

  constructor(private router: Router) {}

  validerNom(): boolean {
    if (!this.nom.trim()) {
      this.erreurNom = 'Le nom est obligatoire.';
      return false;
    }
    this.erreurNom = '';
    return true;
  }

  validerEmail(): boolean {
    if (!this.email.trim()) {
      this.erreurEmail = "L'email est obligatoire.";
      return false;
    }
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(this.email)) {
      this.erreurEmail = "Format d'email invalide.";
      return false;
    }
    this.erreurEmail = '';
    return true;
  }

  validerMotDePasse(): boolean {
    if (!this.motDePasse) {
      this.erreurMotDePasse = 'Le mot de passe est obligatoire.';
      return false;
    }
    if (this.motDePasse.length < 9) {
      this.erreurMotDePasse = 'Le mot de passe doit contenir au moins 9 caractères.';
      return false;
    }
    const aMinuscule = /[a-z]/.test(this.motDePasse);
    const aMajuscule = /[A-Z]/.test(this.motDePasse);
    const aChiffre = /\d/.test(this.motDePasse);
    const aSymbole = /[^A-Za-z0-9]/.test(this.motDePasse);

    if (!aMinuscule || !aMajuscule || !aChiffre || !aSymbole) {
      this.erreurMotDePasse =
        'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un symbole (ex : ! @ # $ %).';
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
      this.erreur = 'Corrigez les champs signalés ci-dessus.';
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
      this.erreur = error.message;
      return;
    }

    this.router.navigate(['/bienvenue']);
  }
}