import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EtapesCommandeService } from '../../services/etapes-commande';
import { FactureService } from '../../services/facture';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-mes-commandes',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './mes-commandes.html',
  styleUrl: './mes-commandes.css',
})
export class MesCommandes implements OnInit {
  commandes: any[] = [];
  chargement = true;
  etapesSurPlace = ['reçue', 'en préparation', 'prête', 'servie'];
  etapesLivraison = ['reçue', 'en préparation', 'prête', 'en route', 'livrée'];

  constructor(
    private cdr: ChangeDetectorRef,
    public etapesCommande: EtapesCommandeService,
    private factureService: FactureService
  ) {}

  ngOnInit() {
    this.chargerCommandes();

    setInterval(() => {
      this.chargerCommandes();
    }, 5000);
  }

  getEtapes(commande: any): string[] {
    return commande.mode === 'livraison' ? this.etapesLivraison : this.etapesSurPlace;
  }

  telechargerFacture(commande: any) {
    this.factureService.telecharger(commande);
  }

  async chargerCommandes() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      this.chargement = false;
      return;
    }

    const { data, error } = await supabase
      .from('commandes')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('masquee_client', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des commandes :', error);
      this.chargement = false;
      return;
    }

    this.commandes = data;
    this.chargement = false;
    this.cdr.detectChanges();
  }

  getClasseStatut(statut: string): string {
    return 'statut-' + statut.replace(/ /g, '-');
  }

  peutAnnuler(commande: any): boolean {
    if (commande.statut !== 'reçue') {
      return false;
    }
    const creee = new Date(commande.created_at).getTime();
    const maintenant = Date.now();
    return maintenant - creee < 60000;
  }

  async annuler(commande: any) {
    const { error } = await supabase
      .from('commandes')
      .update({ statut: 'annulée' })
      .eq('id', commande.id);

    if (error) {
      console.error('Erreur lors de l\'annulation :', error);
      return;
    }

    this.chargerCommandes();
  }

  async supprimer(commande: any) {
    const { error } = await supabase
      .from('commandes')
      .update({ masquee_client: true })
      .eq('id', commande.id);

    if (error) {
      console.error('Erreur lors de la suppression :', error);
      return;
    }

    this.chargerCommandes();
  }
}