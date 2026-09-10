import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-evenement',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
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

  constructor(private route: ActivatedRoute, private translate: TranslateService) {}

  ngOnInit() {
    this.restaurantId = this.route.snapshot.queryParams['restaurant_id'] || null;
  }

  validerDate(): boolean {
    if (!this.date) {
      this.erreurDate = this.translate.instant('evenement.erreurDateRequise');
      return false;
    }
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    if (new Date(this.date) < aujourdHui) {
      this.erreurDate = this.translate.instant('evenement.erreurDatePassee');
      return false;
    }
    this.erreurDate = '';
    return true;
  }

  validerNom(): boolean {
    if (!this.nom.trim()) {
      this.erreurNom = this.translate.instant('evenement.erreurNomRequis');
      return false;
    }
    this.erreurNom = '';
    return true;
  }

  validerTelephone(): boolean {
    if (!this.telephone.trim()) {
      this.erreurTelephone = this.translate.instant('evenement.erreurTelephoneRequis');
      return false;
    }
    if (!/^6\d{8}$/.test(this.telephone.trim())) {
      this.erreurTelephone = this.translate.instant('evenement.erreurTelephoneInvalide');
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
      this.erreur = this.translate.instant('evenement.erreurChampsSignales');
      return;
    }

    if (!this.restaurantId) {
      this.erreur = this.translate.instant('evenement.erreurRestaurantManquant');
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
      this.erreur = this.translate.instant('evenement.erreurEnvoi');
      return;
    }

    this.demandeEnvoyee = true;
  }
}