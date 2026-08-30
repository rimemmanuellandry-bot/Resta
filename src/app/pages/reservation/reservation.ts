import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-reservation',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class Reservation implements OnInit {
  restaurantId: string | null = null;

  date = '';
  heure = '';
  nombrePersonnes = 2;
  nom = '';
  telephone = '';
  note = '';

  erreurDate = '';
  erreurHeure = '';
  erreurNom = '';
  erreurTelephone = '';
  erreur = '';
  chargement = false;
  reservationConfirmee = false;

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

  validerHeure(): boolean {
    if (!this.heure) {
      this.erreurHeure = "L'heure est obligatoire.";
      return false;
    }
    this.erreurHeure = '';
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

  async envoyerReservation() {
    this.erreur = '';

    const dateValide = this.validerDate();
    const heureValide = this.validerHeure();
    const nomValide = this.validerNom();
    const telephoneValide = this.validerTelephone();

    if (!dateValide || !heureValide || !nomValide || !telephoneValide) {
      this.erreur = 'Corrigez les champs signalés ci-dessus.';
      return;
    }

    if (!this.restaurantId) {
      this.erreur = 'Aucun restaurant sélectionné.';
      return;
    }

    this.chargement = true;

    const dateHeure = new Date(`${this.date}T${this.heure}`);

    const { error } = await supabase.from('reservations').insert({
      restaurant_id: this.restaurantId,
      nom: this.nom,
      telephone: this.telephone,
      date_heure: dateHeure.toISOString(),
      nombre_personnes: this.nombrePersonnes,
      note: this.note || null,
      statut: 'en_attente',
    });

    this.chargement = false;

    if (error) {
      console.error('Erreur lors de la réservation :', error);
      this.erreur = 'Une erreur est survenue, réessayez.';
      return;
    }

    this.reservationConfirmee = true;
  }
}