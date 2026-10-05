import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
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

  private routerSub?: Subscription;
  private realtimeListener = (nouveauMsg: Message) => {
    // Si le widget n'est pas censé être visible (admin ou pages auth), ignorer
    if (!this.estVisible) return;

    if (
      nouveauMsg.client_id === this.userId &&
      (!this.restaurantId || String(nouveauMsg.restaurant_id) === String(this.restaurantId))
    ) {
      if (!this.messages.some(m => m.id === nouveauMsg.id)) {
        this.messages.push(nouveauMsg);
      }
      if (!this.ouvert) {
        this.nonLusWidget++;
      } else {
        this.marquerLus();
      }
      this.defilerBas();
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
        this.determinerVisibilite(e.urlAfterRedirects || e.url);
      });

    await this.verifierUtilisateur();

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

  determinerVisibilite(url: string) {
    const chemin = (url || '').split('?')[0].replace(/\/+$/, '') || '/';
    const estPageExclue =
      chemin === '/' ||
      chemin === '/connexion' ||
      chemin.startsWith('/admin') ||
      chemin.startsWith('/statistiques');

    this.estVisible = !estPageExclue && !this.estAdmin;
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
      this.determinerVisibilite(this.router.url);
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
      await this.determinerRestaurant();
    }

    this.determinerVisibilite(this.router.url);

    // Initialiser le canal temps réel Supabase seulement si ce n'est pas un admin (l'admin gère via l'interface admin dédiée)
    if (!this.estAdmin) {
      this.chatService.initialiserRealtime(this.userId, this.realtimeListener);

      if (this.restaurantId) {
        await this.chargerHistorique();
      }
    }

    this.cdr.detectChanges();
  }

  async determinerRestaurant() {
    if (this.panierService.restaurantId) {
      this.restaurantId = this.panierService.restaurantId;
    } else {
      // 1. Commande récente
      const { data: cmd } = await supabase
        .from('commandes')
        .select('restaurant_id')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cmd?.restaurant_id) {
        this.restaurantId = String(cmd.restaurant_id);
      } else {
        // 2. Premier restaurant enregistré
        const { data: resto } = await supabase
          .from('restaurants')
          .select('id, nom')
          .limit(1)
          .maybeSingle();
        if (resto) {
          this.restaurantId = String(resto.id);
          this.nomRestaurant = resto.nom;
        }
      }
    }

    // Récupérer le nom du restaurant
    if (this.restaurantId) {
      const { data: resto } = await supabase
        .from('restaurants')
        .select('nom')
        .eq('id', this.restaurantId)
        .maybeSingle();
      if (resto?.nom) {
        this.nomRestaurant = resto.nom;
      }
    }
  }

  async toggleWidget() {
    this.ouvert = !this.ouvert;
    this.chatService.fermerToast();

    if (this.ouvert) {
      this.nonLusWidget = 0;
      if (this.estConnecte) {
        if (!this.restaurantId) {
          await this.determinerRestaurant();
        }
        await this.chargerHistorique();
        await this.marquerLus();
        this.defilerBas();
      }
    }
  }

  fermerWidget() {
    this.ouvert = false;
  }

  ouvrirDepuisToast() {
    this.ouvert = true;
    this.chatService.fermerToast();
    this.nonLusWidget = 0;
    if (this.restaurantId) {
      this.chargerHistorique().then(() => {
        this.marquerLus();
        this.defilerBas();
      });
    }
  }

  async chargerHistorique() {
    if (!this.restaurantId || !this.userId) {
      return;
    }
    this.chargement = true;
    this.messages = await this.chatService.chargerMessages(this.restaurantId, this.userId);
    this.chargement = false;
    this.cdr.detectChanges();
    this.defilerBas();
  }

  async envoyer() {
    const texte = this.nouveauMessage.trim();
    if (!texte || !this.restaurantId || !this.userId) {
      return;
    }

    this.nouveauMessage = '';

    const messageEnvoye = await this.chatService.envoyerMessage({
      restaurantId: this.restaurantId,
      clientId: this.userId,
      clientNom: this.userName,
      expediteurId: this.userId,
      expediteurRole: this.estAdmin ? 'admin' : 'client',
      texte,
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
