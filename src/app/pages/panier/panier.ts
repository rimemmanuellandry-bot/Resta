import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PanierService } from '../../services/panier';
import { supabase } from '../../supabase';
import { Plat } from '../../services/panier';
@Component({
  selector: 'app-panier',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './panier.html',
  styleUrl: './panier.css',
})
export class Panier {
  erreurAdresse = '';
  erreurTelephone = '';
  erreurTelephonePaiement = '';
  erreur = '';

  constructor(public panierService: PanierService, private router: Router) {}

  retirer(id: number) {
    this.panierService.retirerUn(id);
  }

  ajouter(plat: Plat) {          // ← nouvelle méthode
    this.panierService.ajouter(plat);
  }

  validerAdresse(): boolean {
    if (this.panierService.mode !== 'livraison') {
      this.erreurAdresse = '';
      return true;
    }
    if (!this.panierService.adresse.trim()) {
      this.erreurAdresse = "L'adresse est obligatoire pour une livraison.";
      return false;
    }
    this.erreurAdresse = '';
    return true;
  }

  validerTelephone(): boolean {
    if (this.panierService.mode !== 'livraison') {
      this.erreurTelephone = '';
      return true;
    }
    if (!this.panierService.telephone.trim()) {
      this.erreurTelephone = 'Le téléphone est obligatoire pour une livraison.';
      return false;
    }
    if (!/^6\d{8}$/.test(this.panierService.telephone.trim())) {
      this.erreurTelephone = 'Numéro invalide (9 chiffres, doit commencer par 6).';
      return false;
    }
    this.erreurTelephone = '';
    return true;
  }

  validerTelephonePaiement(): boolean {
    if (!this.panierService.moyenPaiement) {
      this.erreurTelephonePaiement = '';
      return true;
    }
    if (!this.panierService.telephonePaiement.trim()) {
      this.erreurTelephonePaiement = 'Le numéro de paiement est obligatoire.';
      return false;
    }
    if (!/^6\d{8}$/.test(this.panierService.telephonePaiement.trim())) {
      this.erreurTelephonePaiement = 'Numéro invalide (9 chiffres, doit commencer par 6).';
      return false;
    }
    this.erreurTelephonePaiement = '';
    return true;
  }

  async commander() {
    this.erreur = '';

    const adresseValide = this.validerAdresse();
    const telephoneValide = this.validerTelephone();
    const telephonePaiementValide = this.validerTelephonePaiement();

    if (!adresseValide || !telephoneValide || !telephonePaiementValide) {
      this.erreur = 'Corrigez les champs signalés ci-dessus.';
      return;
    }

    const { data, error } = await supabase
      .from('commandes')
      .insert({
        table_numero: this.panierService.table,
        restaurant_id: this.panierService.restaurantId,
        plats: this.panierService.panier,
        total: this.panierService.getTotal(),
        statut: 'reçue',
        mode: this.panierService.mode,
        adresse: this.panierService.adresse,
        telephone: this.panierService.telephone,
        moyen_paiement: this.panierService.moyenPaiement,
        statut_paiement: 'en_attente',
        allergies: this.panierService.allergies || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la commande :', error);
      alert('Une erreur est survenue, réessayez.');
      return;
    }

    this.panierService.commandeId = data.id;
    this.panierService.vider();
    this.router.navigate(['/commande-status']);
  }
}