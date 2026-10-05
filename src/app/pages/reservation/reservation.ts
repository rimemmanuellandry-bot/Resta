import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChatService } from '../../services/chat';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-reservation',
  imports: [CommonModule, FormsModule, TranslatePipe],
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private chatService: ChatService
  ) {}

  async ngOnInit() {
    this.restaurantId = this.route.snapshot.queryParams['restaurant_id'] || null;
    if (!this.restaurantId) {
      const { data: resto } = await supabase
        .from('restaurants')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (resto?.id) {
        this.restaurantId = String(resto.id);
      }
    }
  }

  validerDate(): boolean {
    if (!this.date) {
      this.erreurDate = this.translate.instant('reservation.erreurDateRequise');
      return false;
    }
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    if (new Date(this.date) < aujourdHui) {
      this.erreurDate = this.translate.instant('reservation.erreurDatePassee');
      return false;
    }
    this.erreurDate = '';
    return true;
  }

  validerHeure(): boolean {
    if (!this.heure) {
      this.erreurHeure = this.translate.instant('reservation.erreurHeureRequise');
      return false;
    }
    this.erreurHeure = '';
    return true;
  }

  validerNom(): boolean {
    if (!this.nom.trim()) {
      this.erreurNom = this.translate.instant('reservation.erreurNomRequis');
      return false;
    }
    this.erreurNom = '';
    return true;
  }

  validerTelephone(): boolean {
    const netTel = this.telephone.replace(/\s+/g, '').replace(/^\+237/, '');
    if (!netTel) {
      this.erreurTelephone = this.translate.instant('reservation.erreurTelephoneRequis');
      return false;
    }
    if (!/^6\d{8}$/.test(netTel)) {
      this.erreurTelephone = this.translate.instant('reservation.erreurTelephoneInvalide');
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
      this.erreur = this.translate.instant('reservation.erreurChampsSignales');
      return;
    }

    if (!this.restaurantId) {
      const { data: resto } = await supabase
        .from('restaurants')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (resto?.id) {
        this.restaurantId = String(resto.id);
      } else {
        this.restaurantId = '1';
      }
    }

    this.chargement = true;

    const dateHeure = new Date(`${this.date}T${this.heure}`);
    const { data: userData } = await supabase.auth.getUser();
    const netTel = this.telephone.replace(/\s+/g, '').replace(/^\+237/, '');

    const { error } = await supabase.from('reservations').insert({
      restaurant_id: this.restaurantId,
      nom: this.nom.trim(),
      telephone: netTel,
      date_heure: dateHeure.toISOString(),
      nombre_personnes: this.nombrePersonnes,
      note: this.note ? this.note.trim() : null,
      statut: 'en_attente',
      user_id: userData.user?.id || null,
    });

    this.chargement = false;

    if (error) {
      console.error('Erreur lors de la réservation :', error);
      this.erreur = this.translate.instant('reservation.erreurEnvoi');
      return;
    }

    // Départ direct vers la page d'accueil avec toast de confirmation Resta
    const messageConfirmation = this.translate.instant('reservation.confirmationTexte1') || '✓ Votre demande de réservation a bien été envoyée.';
    this.chatService.afficherToast('Resta', messageConfirmation);
    this.router.navigate(['/bienvenue']);
  }
}