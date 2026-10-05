import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { supabase } from '../../supabase';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { NotificationsService, NotificationItem } from '../../services/notification';
import { ChatService, ConversationResume, Message } from '../../services/chat';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  estConnecte = false;
  estAdmin = false;
  restaurantId: string | null = null;
  afficherRetour = false;
  menuOuvert = false;
  langueActuelle = 'fr';
  private intervalId: any = null;

  userId: string | null = null;
  notificationsNonLues: NotificationItem[] = [];
  notificationsLues: NotificationItem[] = [];
  notificationsOuvertes = false;

  // Cloche notifications Admin (Messages reçus)
  totalMessagesNonLusAdmin = 0;
  conversationsAdmin: ConversationResume[] = [];
  notificationsAdminOuvertes = false;

  private pagesSansRetour = ['/', '/bienvenue'];
  private navigationsInternes = 0;
  private premiereNavigation = true;

  private chatListener = (_msg: Message) => {
    if (this.estAdmin) {
      this.chargerNotificationsAdmin();
    }
  };

  constructor(
    private router: Router,
    private location: Location,
    private translate: TranslateService,
    private notificationsService: NotificationsService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.majAffichageRetour(this.location.path());

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        if (this.premiereNavigation) {
          this.premiereNavigation = false;
        } else {
          this.navigationsInternes++;
        }
        this.majAffichageRetour(e.urlAfterRedirects);
        this.menuOuvert = false;
        this.notificationsOuvertes = false;
        this.notificationsAdminOuvertes = false;
      });

    this.verifierSession();

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        this.verifierSession();
      } else {
        this.estConnecte = false;
        this.estAdmin = false;
        this.restaurantId = null;
        this.userId = null;
        this.notificationsNonLues = [];
        this.notificationsLues = [];
        this.conversationsAdmin = [];
        this.totalMessagesNonLusAdmin = 0;
        this.chatService.retirerListener(this.chatListener);
      }
    });

    this.intervalId = setInterval(() => {
      if (this.estConnecte && !this.estAdmin && this.userId) {
        this.chargerNotifications();
      } else if (this.estConnecte && this.estAdmin) {
        this.chargerNotificationsAdmin();
      }
    }, 4000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.chatService.retirerListener(this.chatListener);
  }

  toggleMenu() {
    this.menuOuvert = !this.menuOuvert;
    this.notificationsOuvertes = false;
    this.notificationsAdminOuvertes = false;
  }

  fermerMenu() {
    this.menuOuvert = false;
  }

  toggleNotifications() {
    this.notificationsOuvertes = !this.notificationsOuvertes;
    this.menuOuvert = false;
    this.notificationsAdminOuvertes = false;
  }

  fermerNotifications() {
    this.notificationsOuvertes = false;
  }

  toggleNotificationsAdmin() {
    this.notificationsAdminOuvertes = !this.notificationsAdminOuvertes;
    this.menuOuvert = false;
    this.notificationsOuvertes = false;

    if (this.notificationsAdminOuvertes) {
      this.chargerNotificationsAdmin();
    }
  }

  fermerNotificationsAdmin() {
    this.notificationsAdminOuvertes = false;
  }

  ouvrirConversationAdmin(conv: ConversationResume) {
    this.notificationsAdminOuvertes = false;
    this.router.navigate(['/admin'], {
      queryParams: {
        restaurant_id: this.restaurantId,
        client_id: conv.client_id
      }
    }).then(() => {
      setTimeout(() => {
        const el = document.getElementById('section-messagerie');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    });
  }

  allerVersMessagerieAdmin() {
    this.notificationsAdminOuvertes = false;
    this.router.navigate(['/admin'], {
      queryParams: { restaurant_id: this.restaurantId }
    }).then(() => {
      setTimeout(() => {
        const el = document.getElementById('section-messagerie');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    });
  }

  libelleNotification(item: NotificationItem): string {
    const langue = this.translate.currentLang() || 'fr';
    const localeDate = langue === 'en' ? 'en-US' : 'fr-FR';
    const dateFormatee = new Date(item.date).toLocaleDateString(localeDate);

    if (item.type === 'reservation') {
      return item.statut === 'confirmee'
        ? this.translate.instant('notifications.reservationConfirmee', { date: dateFormatee })
        : this.translate.instant('notifications.reservationRefusee', { date: dateFormatee });
    }

    return item.statut === 'confirmee'
      ? this.translate.instant('notifications.evenementConfirme', { date: dateFormatee })
      : this.translate.instant('notifications.evenementRefuse', { date: dateFormatee });
  }

  async marquerVue(item: NotificationItem) {
    await this.notificationsService.marquerVue(item);
    this.notificationsNonLues = this.notificationsNonLues.filter(n => !(n.id === item.id && n.type === item.type));
    item.vue = true;
    this.notificationsLues.unshift(item);
    this.notificationsLues = this.notificationsLues.slice(0, 15);
  }

  async supprimer(notif: NotificationItem, event: Event) {
    event.stopPropagation();
    await this.notificationsService.supprimer(notif);
    this.notificationsNonLues = this.notificationsNonLues.filter(n => n.id !== notif.id);
    this.notificationsLues = this.notificationsLues.filter(n => n.id !== notif.id);
  }

  changerLangue(langue: string) {
    this.langueActuelle = langue;
    this.translate.use(langue);
  }

  private async chargerNotifications() {
    if (!this.userId) {
      return;
    }
    const { nonLues, lues } = await this.notificationsService.charger(this.userId);
    this.notificationsNonLues = nonLues;
    this.notificationsLues = lues;
    this.cdr.detectChanges();
  }

  async chargerNotificationsAdmin() {
    if (!this.estAdmin) return;
    this.conversationsAdmin = await this.chatService.chargerConversationsAdmin(this.restaurantId);
    this.totalMessagesNonLusAdmin = this.conversationsAdmin.reduce((sum, c) => sum + (c.non_lus || 0), 0);
    this.cdr.detectChanges();
  }

  private async verifierSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      this.estConnecte = false;
      this.estAdmin = false;
      this.userId = null;
      return;
    }

    this.estConnecte = true;
    this.userId = session.user.id;

    const { data: admin } = await supabase
      .from('admins')
      .select('restaurant_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (admin) {
      this.estAdmin = true;
      this.restaurantId = admin.restaurant_id ? String(admin.restaurant_id) : null;
      await this.chargerNotificationsAdmin();
      this.chatService.initialiserRealtime(this.userId, this.chatListener);
    } else {
      this.estAdmin = false;
      this.restaurantId = null;
      this.chargerNotifications();
    }
    this.cdr.detectChanges();
  }

  private majAffichageRetour(url: string) {
    const chemin = url.split('?')[0];
    this.afficherRetour = !this.pagesSansRetour.includes(chemin);
  }

  retour() {
    if (this.navigationsInternes > 0) {
      this.location.back();
      return;
    }

    const chemin = this.router.url.split('?')[0];

    if (chemin === '/statistiques' && this.restaurantId) {
      this.router.navigate(['/admin'], { queryParams: { restaurant_id: this.restaurantId } });
      return;
    }

    this.router.navigate(['/bienvenue']);
  }

  async seDeconnecter() {
    await supabase.auth.signOut();
    this.estConnecte = false;
    this.estAdmin = false;
    this.notificationsNonLues = [];
    this.notificationsLues = [];
    this.conversationsAdmin = [];
    this.totalMessagesNonLusAdmin = 0;
    this.menuOuvert = false;
    this.router.navigate(['/']);
  }
}