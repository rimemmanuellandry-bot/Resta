import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-evenement',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './evenement.html',
  styleUrl: './evenement.css',
})
export class Evenement implements OnInit {
  restaurantId: string | null = null;

  typePrestation = 'Anniversaire';
  date = '';
  heure = '';
  nombrePersonnes = 10;
  budgetIndicatif: number | null = null;
  nom = '';
  telephone = '';
  description = '';

  erreurDate = '';
  erreurNom = '';
  erreurTelephone = '';
  erreur = '';
  chargement = false;
  demandeEnvoyee = false;

  typesDisponibles = ['Anniversaire', 'Mariage', 'Séminaire', 'Repas d\'entreprise', 'Autre'];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.restaurantId = this.route.snapshot.queryParams['restaurant_id'] || null;
  }

  validerDate(): boolean {
    if (!this.date) {
      this.erreurDate = 'La date est obligatoire.';
      return false;
    }
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    if (new Date(this.date) < aujourdHui) {
      this.erreurDate = 'La date ne peut pas être dans le passé.';
      return false;
    }
    this.erreurDate = '';
    return true;
  }

  validerNom(): boolean {
    if (!this.nom.trim()) {
      this.erreurNom = 'Le nom est obligatoire.';
      return false;
    }
    this.erreurNom = '';
    return true;
  }

  validerTelephone(): boolean {
    if (!this.telephone.trim()) {
      this.erreurTelephone = 'Le téléphone est obligatoire.';
      return false;
    }
    if (!/^6\d{8}$/.test(this.telephone.trim())) {
      this.erreurTelephone = 'Numéro invalide (9 chiffres, doit commencer par 6).';
      return false;
    }
    this.erreurTelephone = '';
    return true;
  }

  async envoyerDemande() {
    this.erreur = '';

    const dateValide = this.validerDate();
    const nomValide = this.validerNom();
    const telephoneValide = this.validerTelephone();

    if (!dateValide || !nomValide || !telephoneValide) {
      this.erreur = 'Corrigez les champs signalés ci-dessus.';
      return;
    }

    if (!this.restaurantId) {
      this.erreur = 'Aucun restaurant sélectionné.';
      return;
    }

    this.chargement = true;

    const { error } = await supabase.from('demandes_evenement').insert({
      restaurant_id: this.restaurantId,
      type_prestation: this.typePrestation,
      date_evenement: this.date,
      heure: this.heure || null,
      nombre_personnes: this.nombrePersonnes,
      budget_indicatif: this.budgetIndicatif || null,
      nom: this.nom,
      telephone: this.telephone,
      description: this.description || null,
      statut: 'en_attente',
    });

    this.chargement = false;

    if (error) {
      console.error('Erreur lors de l\'envoi de la demande :', error);
      this.erreur = 'Une erreur est survenue, réessayez.';
      return;
    }

    this.demandeEnvoyee = true;
  }
}