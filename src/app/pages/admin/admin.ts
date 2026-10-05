import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EtapesCommandeService } from '../../services/etapes-commande';
import { ChatService, Message, ConversationResume } from '../../services/chat';
import { supabase } from '../../supabase';

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
  imports: [FormsModule, CommonModule, RouterLink, TranslatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit, OnDestroy {
  @ViewChild('chatZoneMessages') private chatZoneMessagesRef?: ElementRef;

  reservations: Reservation[] = [];
  commandes: Commande[] = [];
  plats: Plat[] = [];
  demandesEvenement: DemandeEvenement[] = [];
  nouveauPlat = { nom: '', prix: 0, description: '', categorie: '' };
  etapesSurPlace = ['reçue', 'en préparation', 'prête', 'servie'];
  etapesLivraison = ['reçue', 'en préparation', 'prête', 'en route', 'livrée'];
  platEnEditionId: number | null = null;
  restaurantId: string | null = null;
  private intervalId: any = null;

  conversations: ConversationResume[] = [];
  discussionActive: ConversationResume | null = null;
  messagesDiscussionActive: Message[] = [];
  reponseAdmin = '';
  chargementChat = false;
  adminUserId: string | null = null;

  private realtimeListener = (nouveauMsg: Message) => {
    const concerneAdmin = !this.restaurantId || !nouveauMsg.restaurant_id || String(nouveauMsg.restaurant_id) === String(this.restaurantId);
    if (concerneAdmin) {
      this.chargerConversations();
      if (this.discussionActive && this.discussionActive.client_id === nouveauMsg.client_id) {
        if (!this.messagesDiscussionActive.some(m => m.id === nouveauMsg.id)) {
          this.messagesDiscussionActive.push(nouveauMsg);
          const restId = this.restaurantId || (nouveauMsg.restaurant_id ? String(nouveauMsg.restaurant_id) : '1');
          this.chatService.marquerCommeLus(restId, this.discussionActive.client_id, 'client');
          this.defilerBasDiscussion();
        }
      }
      this.cdr.detectChanges();
    }
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private translate: TranslateService,
    public etapesCommande: EtapesCommandeService,
    public chatService: ChatService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await supabase.auth.getSession();
    let adminRestaurantId: string | null = null;

    if (session) {
      this.adminUserId = session.user.id;
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('restaurant_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (adminRecord && adminRecord.restaurant_id) {
        adminRestaurantId = String(adminRecord.restaurant_id);
      }
    }

    // Récupérer le premier restaurant disponible si aucun n'est configuré
    if (!adminRestaurantId) {
      const { data: resto } = await supabase
        .from('restaurants')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (resto?.id) {
        adminRestaurantId = String(resto.id);
      }
    }

    this.route.queryParams.subscribe(async params => {
      const paramId = params['restaurant_id'] || null;
      this.restaurantId = paramId || adminRestaurantId;

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

      this.chargerCommandes();
      this.chargerPlats();
      this.chargerReservations();
      this.chargerDemandesEvenement();
      await this.chargerConversations();
    });

    if (this.adminUserId) {
      this.chatService.initialiserRealtime(this.adminUserId, this.realtimeListener);
    }

    this.intervalId = setInterval(async () => {
      this.chargerCommandes();
      this.chargerReservations();
      this.chargerDemandesEvenement();
      await this.chargerConversations();
      if (this.discussionActive) {
        await this.rafraichirDiscussionActive();
      }
    }, 4000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.chatService.retirerListener(this.realtimeListener);
  }

  getEtapes(commande: Commande): string[] {
    return commande.mode === 'livraison' ? this.etapesLivraison : this.etapesSurPlace;
  }
  // Traduit le type de prestation stocké en base (valeur métier en français, ex: "Mariage")
  libelleTypePrestation(type: string): string {
    return this.translate.instant('evenement.types.' + type);
  }

  async chargerCommandes() {
    const { data, error } = await supabase
      .from('commandes')
      .select('*')
      .eq('restaurant_id', this.restaurantId)
      .neq('statut', 'servie')
      .neq('statut', 'livrée')
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
    const ancienStatut = reservation.statut;
    reservation.statut = nouveauStatut;
    this.cdr.detectChanges();

    const { error } = await supabase
      .from('reservations')
      .update({ statut: nouveauStatut })
      .eq('id', reservation.id);

    if (error) {
      console.error('Erreur lors de la mise à jour de la réservation :', error);
      alert('Impossible de modifier la réservation : ' + (error.message || 'Vérifiez les droits RLS sur Supabase.'));
      reservation.statut = ancienStatut;
      this.cdr.detectChanges();
      return;
    }

    await this.chargerReservations();
  }

  async supprimerReservation(id: number) {
    if (!confirm('Confirmez-vous la suppression de cette réservation ?')) {
      return;
    }

    const anciennes = [...this.reservations];
    this.reservations = this.reservations.filter(r => r.id !== id);
    this.cdr.detectChanges();

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de la réservation :', error);
      alert('Impossible de supprimer la réservation : ' + (error.message || 'Vérifiez les droits RLS sur Supabase.'));
      this.reservations = anciennes;
      this.cdr.detectChanges();
      return;
    }

    await this.chargerReservations();
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
      alert(this.translate.instant('admin.menu.erreurNomPrixRequis'));
      return;
    }

    if (!this.restaurantId) {
      alert(this.translate.instant('admin.menu.erreurRestaurantManquant'));
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
    const ancien = demande.statut;
    demande.statut = nouveauStatut;
    this.cdr.detectChanges();

    const { error } = await supabase
      .from('demandes_evenement')
      .update({ statut: nouveauStatut })
      .eq('id', demande.id);

    if (error) {
      console.error('Erreur lors de la mise à jour :', error);
      alert('Impossible de modifier la demande d\'événement : ' + (error.message || 'Vérifiez les droits RLS sur Supabase.'));
      demande.statut = ancien;
      this.cdr.detectChanges();
      return;
    }

    await this.chargerDemandesEvenement();
  }

  async supprimerDemandeEvenement(id: number) {
    if (!confirm('Confirmez-vous la suppression de cette demande d\'événement ?')) {
      return;
    }

    const anciennes = [...this.demandesEvenement];
    this.demandesEvenement = this.demandesEvenement.filter(d => d.id !== id);
    this.cdr.detectChanges();

    const { error } = await supabase
      .from('demandes_evenement')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression :', error);
      alert('Impossible de supprimer la demande d\'événement : ' + (error.message || 'Vérifiez les droits RLS sur Supabase.'));
      this.demandesEvenement = anciennes;
      this.cdr.detectChanges();
      return;
    }

    await this.chargerDemandesEvenement();
  }

  defilerBasDiscussion() {
    setTimeout(() => {
      if (this.chatZoneMessagesRef) {
        const el = this.chatZoneMessagesRef.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 80);
  }

  async chargerConversations() {
    this.conversations = await this.chatService.chargerConversationsAdmin(this.restaurantId);
    this.cdr.detectChanges();
  }

  async selectionnerConversation(conv: ConversationResume) {
    this.discussionActive = conv;
    conv.non_lus = 0;
    this.chargementChat = true;
    this.messagesDiscussionActive = await this.chatService.chargerMessages(this.restaurantId, conv.client_id);
    const restId = this.restaurantId || (this.messagesDiscussionActive[0]?.restaurant_id ? String(this.messagesDiscussionActive[0].restaurant_id) : '1');
    await this.chatService.marquerCommeLus(restId, conv.client_id, 'client');
    this.chargementChat = false;
    this.cdr.detectChanges();
    this.defilerBasDiscussion();
  }

  async rafraichirDiscussionActive() {
    if (!this.discussionActive) return;
    const derniers = await this.chatService.chargerMessages(this.restaurantId, this.discussionActive.client_id);
    if (
      derniers.length !== this.messagesDiscussionActive.length ||
      (derniers.length > 0 && derniers[derniers.length - 1].id !== this.messagesDiscussionActive[this.messagesDiscussionActive.length - 1]?.id)
    ) {
      this.messagesDiscussionActive = derniers;
      const restId = this.restaurantId || (derniers[0]?.restaurant_id ? String(derniers[0].restaurant_id) : '1');
      await this.chatService.marquerCommeLus(restId, this.discussionActive.client_id, 'client');
      this.cdr.detectChanges();
      this.defilerBasDiscussion();
    }
  }

  async envoyerReponseAdmin() {
    const texte = this.reponseAdmin.trim();
    if (!texte || !this.discussionActive || !this.adminUserId) {
      return;
    }

    const restId = this.restaurantId || (this.messagesDiscussionActive[0]?.restaurant_id ? String(this.messagesDiscussionActive[0].restaurant_id) : '1');

    this.reponseAdmin = '';

    const messageEnvoye = await this.chatService.envoyerMessage({
      restaurantId: restId,
      clientId: this.discussionActive.client_id,
      clientNom: this.discussionActive.client_nom,
      expediteurId: this.adminUserId,
      expediteurRole: 'admin',
      texte,
    });

    if (messageEnvoye) {
      if (!this.messagesDiscussionActive.some(m => m.id === messageEnvoye.id)) {
        this.messagesDiscussionActive.push(messageEnvoye);
      }
      this.chargerConversations();
      this.cdr.detectChanges();
      this.defilerBasDiscussion();
    }
  }

  formaterHeure(dateIso?: string): string {
    if (!dateIso) return '';
    const d = new Date(dateIso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}