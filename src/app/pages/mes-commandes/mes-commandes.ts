import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class MesCommandes implements OnInit, OnDestroy {
  commandes: any[] = [];
  chargement = true;
  etapesSurPlace = ['reçue', 'en préparation', 'prête', 'servie'];
  etapesLivraison = ['reçue', 'en préparation', 'prête', 'en route', 'livrée'];
  maintenant: number = Date.now();
  private intervalId: any = null;
  private timerSecondes: any = null;

  constructor(
    private cdr: ChangeDetectorRef,
    public etapesCommande: EtapesCommandeService,
    private factureService: FactureService
  ) {}

  ngOnInit() {
    this.maintenant = Date.now();
    this.chargerCommandes();

    this.intervalId = setInterval(() => {
      this.chargerCommandes();
    }, 5000);

    // Compte à rebours à la seconde pour disparition nette après 1 minute (60s)
    this.timerSecondes = setInterval(() => {
      this.maintenant = Date.now();
      this.cdr.detectChanges();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timerSecondes) {
      clearInterval(this.timerSecondes);
      this.timerSecondes = null;
    }
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

  secondesRestantes(commande: any): number {
    if (!commande?.created_at) return 0;
    const creee = new Date(commande.created_at).getTime();
    const ecoule = this.maintenant - creee;
    const restantMs = 60000 - ecoule;
    return Math.max(0, Math.ceil(restantMs / 1000));
  }

  peutAnnuler(commande: any): boolean {
    return commande?.statut === 'reçue' && this.secondesRestantes(commande) > 0;
  }

  async annuler(commande: any) {
    if (!this.peutAnnuler(commande)) {
      alert('Le délai d\'annulation d\'une minute est dépassé.');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir annuler votre commande ?')) {
      return;
    }

    const { error } = await supabase
      .from('commandes')
      .update({ statut: 'annulée' })
      .eq('id', commande.id);

    if (error) {
      console.error('Erreur lors de l\'annulation :', error);
      alert('Erreur lors de l\'annulation de la commande.');
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