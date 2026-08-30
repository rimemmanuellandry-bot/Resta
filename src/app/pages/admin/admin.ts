import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { supabase } from '../../supabase';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Commande {
  id: number;
  table_numero: string;
  plats: any[];
  total: number;
  statut: string;
  created_at: string;
  mode: string;
  adresse: string;
  telephone: string;
  allergies: string | null;
  restaurant_id: string;
}
interface Reservation {
  id: number;
  nom: string;
  telephone: string;
  date_heure: string;
  nombre_personnes: number;
  note: string | null;
  statut: string;
}
interface DemandeEvenement {
  id: number;
  type_prestation: string;
  date_evenement: string;
  heure: string | null;
  nombre_personnes: number;
  budget_indicatif: number | null;
  nom: string;
  telephone: string;
  description: string | null;
  statut: string;
}
export interface Plat {
  id: number;
  nom: string;
  prix: number;
  description: string;
  categorie: string;
  image_url: string;
  restaurant_id: string;
  supprime: boolean;
}

@Component({
  selector: 'app-admin',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  reservations: Reservation[] = [];
  commandes: Commande[] = [];
  plats: Plat[] = [];
  demandesEvenement: DemandeEvenement[] = [];
  nouveauPlat = { nom: '', prix: 0, description: '', categorie: '' };
  etapes = ['reçue', 'en préparation', 'prête', 'servie'];
  platEnEditionId: number | null = null;
  restaurantId: string | null = null;

  constructor(private cdr: ChangeDetectorRef, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.restaurantId = params['restaurant_id'] || null;

      if (!this.restaurantId) {
        console.error('Aucun restaurant_id fourni — ajoute ?restaurant_id=... à l\'URL admin.');
        return;
      }

this.chargerCommandes();
this.chargerPlats();
this.chargerReservations();
 
    });

 setInterval(() => {
  if (this.restaurantId) {
    this.chargerCommandes();
    this.chargerReservations();
    this.chargerDemandesEvenement();
  }
}, 3000);
  }

  async chargerCommandes() {
    const { data, error } = await supabase
      .from('commandes')
      .select('*')
      .eq('restaurant_id', this.restaurantId)
      .neq('statut', 'servie')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erreur lors du chargement des commandes :', error);
      return;
    }

    this.commandes = data as Commande[];
    this.cdr.detectChanges();
  }

  async changerStatut(commande: Commande, nouveauStatut: string) {
    const { error } = await supabase
      .from('commandes')
      .update({ statut: nouveauStatut })
      .eq('id', commande.id);

    if (error) {
      console.error('Erreur lors du changement de statut :', error);
      return;
    }

    this.chargerCommandes();
  }
async chargerReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('restaurant_id', this.restaurantId)
    .order('date_heure', { ascending: true });

  if (error) {
    console.error('Erreur lors du chargement des réservations :', error);
    return;
  }

  this.reservations = data as Reservation[];
  this.cdr.detectChanges();
}

async changerStatutReservation(reservation: Reservation, nouveauStatut: string) {
  const { error } = await supabase
    .from('reservations')
    .update({ statut: nouveauStatut })
    .eq('id', reservation.id);

  if (error) {
    console.error('Erreur lors de la mise à jour de la réservation :', error);
    return;
  }

  this.chargerReservations();
}

async supprimerReservation(id: number) {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de la réservation :', error);
    return;
  }

  this.chargerReservations();
}

  async chargerPlats() {
    const { data, error } = await supabase
      .from('plats')
      .select('*')
      .eq('restaurant_id', this.restaurantId)
      .eq('supprime', false);

    if (error) {
      console.error('Erreur lors du chargement des plats :', error);
      return;
    }

    this.plats = data as Plat[];
    this.cdr.detectChanges();
  }

  commencerModification(plat: Plat) {
    this.platEnEditionId = plat.id;
    this.nouveauPlat = {
      nom: plat.nom,
      prix: plat.prix,
      description: plat.description,
      categorie: plat.categorie,
    };
  }

  annulerModification() {
    this.platEnEditionId = null;
    this.nouveauPlat = { nom: '', prix: 0, description: '', categorie: '' };
  }

  async validerPlat() {
    if (!this.nouveauPlat.nom || !this.nouveauPlat.prix) {
      alert('Le nom et le prix sont obligatoires.');
      return;
    }

    if (!this.restaurantId) {
      alert('Impossible d\'enregistrer : aucun restaurant sélectionné.');
      return;
    }

    if (this.platEnEditionId) {
      const { error } = await supabase.from('plats').update({
        nom: this.nouveauPlat.nom,
        prix: this.nouveauPlat.prix,
        description: this.nouveauPlat.description,
        categorie: this.nouveauPlat.categorie,
      }).eq('id', this.platEnEditionId);

      if (error) {
        console.error('Erreur lors de la modification :', error);
        return;
      }

      this.platEnEditionId = null;
    } else {
      const { error } = await supabase.from('plats').insert({
        nom: this.nouveauPlat.nom,
        prix: this.nouveauPlat.prix,
        description: this.nouveauPlat.description,
        categorie: this.nouveauPlat.categorie,
        restaurant_id: this.restaurantId,
        supprime: false,
      });

      if (error) {
        console.error('Erreur lors de l\'ajout du plat :', error);
        return;
      }
    }

    this.nouveauPlat = { nom: '', prix: 0, description: '', categorie: '' };
    this.chargerPlats();
  }

  async supprimerPlat(id: number) {
    const { error } = await supabase
      .from('plats')
      .update({ supprime: true })
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression :', error);
      return;
    }

    this.chargerPlats();
  }
  async chargerDemandesEvenement() {
  const { data, error } = await supabase
    .from('demandes_evenement')
    .select('*')
    .eq('restaurant_id', this.restaurantId)
    .order('date_evenement', { ascending: true });

  if (error) {
    console.error('Erreur lors du chargement des demandes d\'événement :', error);
    return;
  }

  this.demandesEvenement = data as DemandeEvenement[];
  this.cdr.detectChanges();
}

async changerStatutEvenement(demande: DemandeEvenement, nouveauStatut: string) {
  const { error } = await supabase
    .from('demandes_evenement')
    .update({ statut: nouveauStatut })
    .eq('id', demande.id);

  if (error) {
    console.error('Erreur lors de la mise à jour :', error);
    return;
  }

  this.chargerDemandesEvenement();
}

async supprimerDemandeEvenement(id: number) {
  const { error } = await supabase
    .from('demandes_evenement')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression :', error);
    return;
  }

  this.chargerDemandesEvenement();
}
}