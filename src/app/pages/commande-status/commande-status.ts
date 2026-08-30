import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PanierService } from '../../services/panier';
import { supabase } from '../../supabase';
// ⚠ retire la ligne : import jsPDF from 'jspdf';

@Component({
  selector: 'app-commande-status',
  imports: [CommonModule, RouterLink],
  templateUrl: './commande-status.html',
  styleUrl: './commande-status.css',
})
export class CommandeStatus implements OnInit {
  etapes = ['reçue', 'en préparation', 'prête', 'servie'];
  statutActuel: string = 'reçue';
  commande: any = null;

  constructor(public panierService: PanierService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.chargerStatut();

    setInterval(() => {
      this.chargerStatut();
    }, 3000);
  }

  async chargerStatut() {
    if (!this.panierService.commandeId) {
      return;
    }

    const { data, error } = await supabase
      .from('commandes')
      .select('*')
      .eq('id', this.panierService.commandeId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du statut :', error);
      return;
    }

    this.commande = data;
    this.statutActuel = data.statut;

    this.cdr.detectChanges();
  }

  getIndexEtape(): number {
    return this.etapes.indexOf(this.statutActuel);
  }

  async telechargerFacture() {
    if (!this.commande) {
      return;
    }

    const { default: jsPDF } = await import('jspdf');   // ← chargé seulement ici

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Resta - Facture', 20, y);
    y += 12;

    doc.setFontSize(11);
    doc.text(`Commande n° ${this.commande.id}`, 20, y);
    y += 7;
    doc.text(`Date : ${new Date(this.commande.created_at).toLocaleString('fr-FR')}`, 20, y);
    y += 7;
    doc.text(`Mode : ${this.commande.mode === 'livraison' ? 'Livraison' : 'Sur place'}`, 20, y);
    y += 7;

    if (this.commande.mode === 'livraison') {
      doc.text(`Adresse : ${this.commande.adresse}`, 20, y);
      y += 7;
      doc.text(`Téléphone : ${this.commande.telephone}`, 20, y);
      y += 7;
    } else {
      doc.text(`Table n° ${this.commande.table_numero}`, 20, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.text('Détail de la commande', 20, y);
    y += 8;
    doc.setFontSize(11);

    for (const item of this.commande.plats) {
      const sousTotal = item.plat.prix * item.quantite;
      doc.text(`${item.plat.nom}  x${item.quantite}`, 20, y);
      doc.text(`${sousTotal} FCFA`, 160, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.text(`Total : ${this.commande.total} FCFA`, 20, y);
    y += 10;

    if (this.commande.allergies) {
      doc.setFontSize(10);
      doc.text(`Allergies signalées : ${this.commande.allergies}`, 20, y);
      y += 7;
    }

    doc.setFontSize(9);
    doc.text('Merci pour votre commande !', 20, y + 10);

    doc.save(`facture-commande-${this.commande.id}.pdf`);
  }
}