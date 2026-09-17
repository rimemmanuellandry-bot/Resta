import { Injectable } from '@angular/core';
import { supabase } from '../supabase';

export interface NotificationItem {
  id: number;
  type: 'reservation' | 'evenement';
  statut: string;
  date: string;
  vue: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  async charger(userId: string): Promise<{ nonLues: NotificationItem[]; lues: NotificationItem[] }> {
    const [reservations, evenements] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, statut, date_heure, notif_vue')
        .eq('user_id', userId)
        .eq('notif_supprimee', false)
        .neq('statut', 'en_attente')
        .order('date_heure', { ascending: false })
        .limit(20),
      supabase
        .from('demandes_evenement')
        .select('id, statut, date_evenement, notif_vue')
        .eq('user_id', userId)
        .eq('notif_supprimee', false)
        .neq('statut', 'en_attente')
        .order('date_evenement', { ascending: false })
        .limit(20),
    ]);

    const tous: NotificationItem[] = [];

    if (!reservations.error && reservations.data) {
      for (const r of reservations.data) {
        tous.push({ id: r.id, type: 'reservation', statut: r.statut, date: r.date_heure, vue: r.notif_vue });
      }
    }

    if (!evenements.error && evenements.data) {
      for (const e of evenements.data) {
        tous.push({ id: e.id, type: 'evenement', statut: e.statut, date: e.date_evenement, vue: e.notif_vue });
      }
    }

    const nonLues = tous.filter(n => !n.vue);
    const lues = tous.filter(n => n.vue).slice(0, 15);

    return { nonLues, lues };
  }

  async marquerVue(item: NotificationItem) {
    const table = item.type === 'reservation' ? 'reservations' : 'demandes_evenement';
    await supabase.from(table).update({ notif_vue: true }).eq('id', item.id);
  }

  async supprimer(item: NotificationItem) {
    const table = item.type === 'reservation' ? 'reservations' : 'demandes_evenement';
    await supabase.from(table).update({ notif_supprimee: true }).eq('id', item.id);
  }
}