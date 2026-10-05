import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase';

export interface Message {
  id?: number;
  restaurant_id: string | number;
  client_id: string;
  client_nom?: string;
  expediteur_id: string;
  expediteur_role: 'client' | 'admin';
  texte: string;
  lu: boolean;
  created_at?: string;
}

export interface ConversationResume {
  client_id: string;
  client_nom: string;
  dernier_message: string;
  dernier_date: string;
  non_lus: number;
}

export interface ToastNotification {
  id: string;
  titre: string;
  message: string;
  date: Date;
  restaurant_id?: string;
  client_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  readonly notificationToast = signal<ToastNotification | null>(null);
  readonly unreadCountTotal = signal<number>(0);

  private activeChannel: any = null;
  private currentUserId: string | null = null;
  private toastTimeout: any = null;

  constructor() {
    this.demanderPermissionNotifications();
  }

  demanderPermissionNotifications() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  /**
   * Joue le carillon sonore Resta via la Web Audio API
   * Double note mélodique (880 Hz puis 1175 Hz avec enveloppe douce)
   */
  jouerSonNotification() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1 (Bip aigu doux)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Note 2 (Carillon montant)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1175, now + 0.06);
      gain2.gain.setValueAtTime(0, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.25);
    } catch {
      // Ignorer si bloqué par la politique de son du navigateur avant interaction
    }
  }

  // Alias rétrocompatible
  jouerSonWhatsApp() {
    this.jouerSonNotification();
  }

  /**
   * Affiche la bannière flottante de notification Resta
   */
  afficherToast(titre: string, message: string, meta?: { restaurant_id?: string; client_id?: string }) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    const toast: ToastNotification = {
      id: String(Date.now()),
      titre,
      message,
      date: new Date(),
      restaurant_id: meta?.restaurant_id,
      client_id: meta?.client_id,
    };

    this.notificationToast.set(toast);
    this.jouerSonNotification();

    // Notification système navigateur si en arrière-plan
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(titre, {
          body: message,
          icon: '/icons/icon-192x192.png',
        });
      } catch {
        // Ignorer si indisponible
      }
    }

    this.toastTimeout = setTimeout(() => {
      this.fermerToast();
    }, 5500);
  }

  fermerToast() {
    this.notificationToast.set(null);
  }

  /**
   * Initialise l'écoute temps réel Supabase Realtime pour un utilisateur
   */
  initialiserRealtime(userId: string, onMessageRecu?: (msg: Message) => void) {
    this.currentUserId = userId;

    if (this.activeChannel) {
      supabase.removeChannel(this.activeChannel);
      this.activeChannel = null;
    }

    this.activeChannel = supabase
      .channel('resta-chat-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new as Message;
          // Si le message ne vient pas de moi
          if (msg.expediteur_id !== this.currentUserId) {
            const titre = msg.expediteur_role === 'admin'
              ? 'Resta (Restaurant)'
              : (msg.client_nom || 'Nouveau client');
            this.afficherToast(titre, msg.texte, {
              restaurant_id: msg.restaurant_id,
              client_id: msg.client_id,
            });
            this.unreadCountTotal.update(v => v + 1);
          }
          if (onMessageRecu) {
            onMessageRecu(msg);
          }
        }
      )
      .subscribe();
  }

  desinscrireRealtime() {
    if (this.activeChannel) {
      supabase.removeChannel(this.activeChannel);
      this.activeChannel = null;
    }
  }

  async chargerMessages(restaurantId: string, clientId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Erreur chargement messages :', error);
      return [];
    }
    return (data || []) as Message[];
  }

  async envoyerMessage(params: {
    restaurantId: string;
    clientId: string;
    clientNom: string;
    expediteurId: string;
    expediteurRole: 'client' | 'admin';
    texte: string;
  }): Promise<Message | null> {
    const payload = {
      restaurant_id: params.restaurantId,
      client_id: params.clientId,
      client_nom: params.clientNom,
      expediteur_id: params.expediteurId,
      expediteur_role: params.expediteurRole,
      texte: params.texte.trim(),
      lu: false,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'envoi du message :', error);
      return null;
    }

    return data as Message;
  }

  async marquerCommeLus(restaurantId: string, clientId: string, expediteurRoleAEffacer: 'client' | 'admin') {
    await supabase
      .from('messages')
      .update({ lu: true })
      .eq('restaurant_id', restaurantId)
      .eq('client_id', clientId)
      .eq('expediteur_role', expediteurRoleAEffacer)
      .eq('lu', false);
  }

  async chargerConversationsAdmin(restaurantId: string): Promise<ConversationResume[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const conversationsMap = new Map<string, ConversationResume>();

    for (const msg of data as Message[]) {
      if (!conversationsMap.has(msg.client_id)) {
        conversationsMap.set(msg.client_id, {
          client_id: msg.client_id,
          client_nom: msg.client_nom || 'Client',
          dernier_message: msg.texte,
          dernier_date: msg.created_at || new Date().toISOString(),
          non_lus: (!msg.lu && msg.expediteur_role === 'client') ? 1 : 0,
        });
      } else {
        const conv = conversationsMap.get(msg.client_id)!;
        if (!msg.lu && msg.expediteur_role === 'client') {
          conv.non_lus++;
        }
      }
    }

    return Array.from(conversationsMap.values());
  }
}
