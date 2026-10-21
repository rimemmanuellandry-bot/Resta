import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ChatService, Message } from '../../services/chat';
import { PanierService } from '../../services/panier';
import { supabase } from '../../supabase';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  ouvert = false;
  estVisible = false;
  estConnecte = false;
  userId: string | null = null;
  userName = 'Client';
  estAdmin = false;

  restaurantId: string | null = null;
  nomRestaurant = 'Resta Support';

  messages: Message[] = [];
  nouveauMessage = '';
  chargement = false;
  nonLusWidget = 0;

  // Interactions avancées messages Resta (Répondre, Modifier, Copier, Supprimer, Swipe)
  messageEnReponse: Message | null = null;
  messageEnEdition: Message | null = null;
  menuOptionsMessageId: number | null = null;

  swipeMessageId: number | null = null;
  swipeStartX = 0;
  swipeDeltaX = 0;

  private routerSub?: Subscription;
  private realtimeListener = (nouveauMsg: Message, eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT') => {
    // Si le widget n'est pas censé être visible ou si aucun restaurant n'est actif, ignorer
    if (!this.estVisible || !this.restaurantId) return;

    if (
      nouveauMsg.client_id === this.userId &&
      String(nouveauMsg.restaurant_id) === String(this.restaurantId)
    ) {
      if (eventType === 'DELETE') {
        this.messages = this.messages.filter(m => m.id !== nouveauMsg.id);
      } else if (eventType === 'UPDATE') {
        const index = this.messages.findIndex(m => m.id === nouveauMsg.id);
        if (index !== -1) {
          if (this.userId && nouveauMsg.supprime_par?.includes(this.userId)) {
            this.messages.splice(index, 1);
          } else {
            this.messages[index] = { ...this.messages[index], ...nouveauMsg };
          }
        }
      } else {
        if (this.userId && nouveauMsg.supprime_par?.includes(this.userId)) {
          return;
        }
        if (!this.messages.some(m => m.id === nouveauMsg.id)) {
          this.messages.push(nouveauMsg);
        }
        if (!this.ouvert) {
          this.nonLusWidget++;
        } else {
          this.marquerLus();
        }
        this.defilerBas();
      }
      this.cdr.detectChanges();
    }
  };

  constructor(
    public chatService: ChatService,
    private panierService: PanierService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.determinerVisibilite(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        const urlActive = e.urlAfterRedirects || e.url;
        this.determinerVisibilite(urlActive);
        if (urlActive.includes('chat=ouvert')) {
          setTimeout(() => this.ouvrirDepuisToast(), 250);
        }
      });

    await this.verifierUtilisateur();

    if (typeof window !== 'undefined' && window.location.search.includes('chat=ouvert')) {
      setTimeout(() => this.ouvrirDepuisToast(), 400);
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await this.verifierUtilisateur();
      } else {
        this.estConnecte = false;
        this.estAdmin = false;
        this.userId = null;
        this.messages = [];
        this.nonLusWidget = 0;
        this.chatService.retirerListener(this.realtimeListener);
        this.determinerVisibilite(this.router.url);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    this.chatService.retirerListener(this.realtimeListener);
  }

  async determinerVisibilite(url: string) {
    const chemin = (url || '').split('?')[0].replace(/\/+$/, '') || '/';
    const pagesExclues = [
      '',
      '/',
      '/connexion',
      '/inscription',
      '/bienvenue',
      '/localite',
      '/restaurant',
      '/scan',
    ];
    const estPageExclue =
      pagesExclues.includes(chemin) ||
      chemin.startsWith('/admin') ||
      chemin.startsWith('/statistiques');

    await this.determinerRestaurant(url);

    this.estVisible = this.estConnecte && !this.estAdmin && !estPageExclue && !!this.restaurantId;
    if (!this.estVisible && this.ouvert) {
      this.ouvert = false;
    }
    this.cdr.detectChanges();
  }

  async verifierUtilisateur() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      this.estConnecte = false;
      this.userId = null;
      this.estAdmin = false;
      await this.determinerVisibilite(this.router.url);
      return;
    }

    this.estConnecte = true;
    this.userId = session.user.id;
    this.userName = session.user.user_metadata?.['nom'] || 'Client';

    // Vérifier si l'utilisateur est admin
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('restaurant_id')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (adminRecord) {
      this.estAdmin = true;
      this.restaurantId = adminRecord.restaurant_id ? String(adminRecord.restaurant_id) : null;
    } else {
      this.estAdmin = false;
      await this.determinerRestaurant(this.router.url);
    }

    await this.determinerVisibilite(this.router.url);

    // Initialiser le canal temps réel Supabase seulement si ce n'est pas un admin (l'admin gère via l'interface admin dédiée)
    if (!this.estAdmin) {
      this.chatService.initialiserRealtime(this.userId, this.realtimeListener);

      if (this.restaurantId) {
        await this.chargerHistorique();
      }
    }

    this.cdr.detectChanges();
  }

  async determinerRestaurant(url?: string) {
    let nouveauRestoId: string | null = null;

    // 1. Extraire de l'URL si présent (ex: /menu?restaurant_id=2)
    const urlCible = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (urlCible && urlCible.includes('restaurant_id=')) {
      try {
        const queryStr = urlCible.includes('?') ? urlCible.split('?')[1] : '';
        const params = new URLSearchParams(queryStr);
        const pId = params.get('restaurant_id');
        if (pId) {
          nouveauRestoId = String(pId);
        }
      } catch {}
    }

    // 2. PanierService
    if (!nouveauRestoId && this.panierService.restaurantId) {
      nouveauRestoId = String(this.panierService.restaurantId);
    }

    // 3. SessionStorage (sauvegardé lors du clic sur un restaurant)
    if (!nouveauRestoId && typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('resta_selected_restaurant_id');
      if (saved) {
        nouveauRestoId = String(saved);
      }
    }

    const ancienRestoId = this.restaurantId;
    this.restaurantId = nouveauRestoId;

    if (this.restaurantId) {
      this.panierService.restaurantId = this.restaurantId;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('resta_selected_restaurant_id', this.restaurantId);
      }

      // Récupérer le nom du restaurant
      const { data: resto } = await supabase
        .from('restaurants')
        .select('nom')
        .eq('id', this.restaurantId)
        .maybeSingle();
      if (resto?.nom) {
        this.nomRestaurant = resto.nom;
      }
    } else {
      this.nomRestaurant = 'Resta Support';
      this.messages = [];
    }

    // Si le restaurant actif a changé et qu'on est connecté en tant que client, recharger les messages du restaurant
    if (ancienRestoId !== this.restaurantId && this.restaurantId && this.estConnecte && !this.estAdmin) {
      await this.chargerHistorique();
    }
  }

  async toggleWidget() {
    this.ouvert = !this.ouvert;
    this.chatService.fermerToast();

    if (this.ouvert) {
      this.nonLusWidget = 0;
      if (this.estConnecte) {
        if (!this.restaurantId) {
          await this.determinerRestaurant(this.router.url);
        }
        if (this.restaurantId) {
          await this.chargerHistorique();
          await this.marquerLus();
          this.defilerBas();
        }
      }
    }
  }

  fermerWidget() {
    this.ouvert = false;
  }

  async ouvrirDepuisToast() {
    this.ouvert = true;
    this.chatService.fermerToast();
    this.nonLusWidget = 0;
    if (!this.restaurantId) {
      await this.determinerRestaurant(this.router.url);
    }
    if (this.restaurantId) {
      await this.chargerHistorique();
      await this.marquerLus();
      this.defilerBas();
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.menuOptionsMessageId = null;
  }

  toggleMenuOptions(msg: Message) {
    this.menuOptionsMessageId = this.menuOptionsMessageId === msg.id ? null : (msg.id || null);
  }

  repondreA(msg: Message) {
    this.messageEnReponse = msg;
    this.messageEnEdition = null;
    this.menuOptionsMessageId = null;
  }

  annulerReponse() {
    this.messageEnReponse = null;
  }

  commencerEdition(msg: Message) {
    this.messageEnEdition = msg;
    this.messageEnReponse = null;
    this.nouveauMessage = msg.texte;
    this.menuOptionsMessageId = null;
  }

  annulerEdition() {
    this.messageEnEdition = null;
    this.nouveauMessage = '';
  }

  async copierMessage(msg: Message) {
    this.menuOptionsMessageId = null;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(msg.texte);
      this.chatService.afficherToast('Resta', 'Message copié dans le presse-papier');
    }
  }

  async supprimerPourMoi(msg: Message) {
    this.menuOptionsMessageId = null;
    if (!msg.id || !this.userId) return;
    await this.chatService.supprimerPourMoi(msg.id, this.userId, msg.supprime_par);
    this.messages = this.messages.filter(m => m.id !== msg.id);
    this.cdr.detectChanges();
  }

  async supprimerPourTous(msg: Message) {
    this.menuOptionsMessageId = null;
    if (!msg.id) return;
    if (!confirm('Supprimer ce message pour vous et le restaurant ?')) return;
    await this.chatService.supprimerPourTous(msg.id);
    msg.supprime_pour_tous = true;
    msg.texte = 'Ce message a été supprimé';
    this.cdr.detectChanges();
  }

  onTouchStart(event: TouchEvent, msg: Message) {
    this.swipeStartX = event.touches[0].clientX;
    this.swipeMessageId = msg.id || null;
    this.swipeDeltaX = 0;
  }

  onTouchMove(event: TouchEvent, msg: Message) {
    if (this.swipeMessageId !== msg.id) return;
    const currentX = event.touches[0].clientX;
    const diff = currentX - this.swipeStartX;
    if (diff > 0 && diff < 80) {
      this.swipeDeltaX = diff;
    }
  }

  onTouchEnd(_event: TouchEvent, msg: Message) {
    if (this.swipeMessageId === msg.id && this.swipeDeltaX > 40) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
      this.repondreA(msg);
    }
    this.swipeMessageId = null;
    this.swipeDeltaX = 0;
  }

  getSwipeTransform(msg: Message): string {
    if (this.swipeMessageId === msg.id && this.swipeDeltaX > 0) {
      return `translateX(${this.swipeDeltaX}px)`;
    }
    return 'none';
  }

  async chargerHistorique() {
    if (!this.restaurantId || !this.userId) {
      return;
    }
    this.chargement = true;
    this.messages = await this.chatService.chargerMessages(this.restaurantId, this.userId, this.userId);
    this.chargement = false;
    this.cdr.detectChanges();
    this.defilerBas();
  }

  async envoyer() {
    const texte = this.nouveauMessage.trim();
    if (!texte || !this.restaurantId || !this.userId) {
      return;
    }

    // 1. Mode modification de message
    if (this.messageEnEdition && this.messageEnEdition.id) {
      const msgId = this.messageEnEdition.id;
      const succes = await this.chatService.modifierMessage(msgId, texte);
      if (succes) {
        this.messageEnEdition.texte = texte;
        this.messageEnEdition.modifie = true;
      }
      this.messageEnEdition = null;
      this.nouveauMessage = '';
      this.cdr.detectChanges();
      return;
    }

    // 2. Mode envoi d'un nouveau message
    const reponseAId = this.messageEnReponse?.id || null;
    const reponseANom = this.messageEnReponse
      ? (this.messageEnReponse.expediteur_id === this.userId ? 'Vous' : (this.nomRestaurant || 'Resta'))
      : null;
    const reponseATexte = this.messageEnReponse ? this.messageEnReponse.texte : null;

    this.nouveauMessage = '';
    this.messageEnReponse = null;

    const messageEnvoye = await this.chatService.envoyerMessage({
      restaurantId: this.restaurantId,
      clientId: this.userId,
      clientNom: this.userName,
      expediteurId: this.userId,
      expediteurRole: this.estAdmin ? 'admin' : 'client',
      texte,
      reponseAId,
      reponseANom,
      reponseATexte,
    });

    if (messageEnvoye) {
      // Ajouter localement si le realtime n'a pas encore réagi
      if (!this.messages.some(m => m.id === messageEnvoye.id)) {
        this.messages.push(messageEnvoye);
      }
      this.defilerBas();
      this.cdr.detectChanges();
    }
  }

  async marquerLus() {
    if (this.restaurantId && this.userId) {
      const roleAdverse = this.estAdmin ? 'client' : 'admin';
      await this.chatService.marquerCommeLus(this.restaurantId, this.userId, roleAdverse);
      this.nonLusWidget = 0;
    }
  }

  defilerBas() {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 80);
  }

  formaterHeure(dateIso?: string): string {
    if (!dateIso) return '';
    const d = new Date(dateIso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
