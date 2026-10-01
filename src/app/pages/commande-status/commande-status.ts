import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PanierService } from '../../services/panier';
import { EtapesCommandeService } from '../../services/etapes-commande';
import { FactureService } from '../../services/facture';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-commande-status',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './commande-status.html',
  styleUrl: './commande-status.css',
})
export class CommandeStatus implements OnInit, OnDestroy {
  etapesSurPlace = ['reçue', 'en préparation', 'prête', 'servie'];
  etapesLivraison = ['reçue', 'en préparation', 'prête', 'en route', 'livrée'];
  statutActuel: string = 'reçue';
  commande: any = null;
  private intervalId: any = null;

  constructor(
    public panierService: PanierService,
    private cdr: ChangeDetectorRef,
    public etapesCommande: EtapesCommandeService,
    private factureService: FactureService,
    private route: ActivatedRoute
  ) {}

  get etapes(): string[] {
    return this.commande?.mode === 'livraison' ? this.etapesLivraison : this.etapesSurPlace;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const paramId = params['id'] ? Number(params['id']) : null;
      if (paramId) {
        this.panierService.commandeId = paramId;
      } else if (!this.panierService.commandeId && typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('resta_derniere_commande_id');
        if (stored) {
          this.panierService.commandeId = Number(stored);
        }
      }

      this.chargerStatut();
    });

    this.intervalId = setInterval(() => {
      this.chargerStatut();
    }, 3000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
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

  telechargerFacture() {
    if (this.commande) {
      this.factureService.telecharger(this.commande);
    }
  }
}