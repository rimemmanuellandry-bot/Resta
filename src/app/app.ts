import { Component, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Header } from './shared/header/header';
import { ChatWidget } from './shared/chat-widget/chat-widget';
import { ChatService } from './services/chat';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Resta');

  constructor(
    private translate: TranslateService,
    private chatService: ChatService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.initialiserLangue();

    if (isPlatformBrowser(this.platformId)) {
      // Demande de permission et initialisation Service Worker pour notifications système
      this.chatService.demanderPermissionNotifications();
    }
  }

  private initialiserLangue() {
    if (!isPlatformBrowser(this.platformId)) {
      this.translate.use('fr');
      return;
    }

    // 1. Priorité au choix manuel précédemment sélectionné par l'utilisateur
    const langueSauvegardee = localStorage.getItem('resta_langue');
    if (langueSauvegardee === 'fr' || langueSauvegardee === 'en') {
      this.translate.use(langueSauvegardee);
      return;
    }

    // 2. Détection automatique de la langue du téléphone / système
    const langueNavigateur = (navigator.language || (navigator as any).userLanguage || 'fr').toLowerCase();
    const langueDetectee = langueNavigateur.startsWith('en') ? 'en' : 'fr';

    this.translate.use(langueDetectee);
  }
}