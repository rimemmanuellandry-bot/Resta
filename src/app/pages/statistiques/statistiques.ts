import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { supabase } from '../../supabase';

interface LigneCommande {
  total: number;
  moyen_paiement: string;
  plats: { plat: { categorie: string; nom: string }; quantite: number }[];
  created_at: string;
  statut: string;
}

@Component({
  selector: 'app-statistiques',
  imports: [CommonModule],
  templateUrl: './statistiques.html',
  styleUrl: './statistiques.css',
})
export class Statistiques implements OnInit {
  restaurantId: string | null = null;

  caJour = 0;
  caSemaine = 0;
  caMois = 0;
  caAnnee = 0;

  commandesJour = 0;
  commandesSemaine = 0;
  commandesMois = 0;
  commandesAnnee = 0;

  caParPaiement: { moyen: string; total: number }[] = [];
  caParCategorie: { categorie: string; total: number }[] = [];

  commandesRecentes: LigneCommande[] = [];
  chargementTermine = false;

  constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.restaurantId = this.route.snapshot.queryParams['restaurant_id'] || null;

    if (!this.restaurantId) {
      console.error('Aucun restaurant_id fourni.');
      this.chargementTermine = true;
      this.cdr.detectChanges();
      return;
    }

    const maintenant = new Date();

    const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

    const jourSemaine = maintenant.getDay() === 0 ? 7 : maintenant.getDay();
    const debutSemaine = new Date(debutJour);
    debutSemaine.setDate(debutJour.getDate() - (jourSemaine - 1));

    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debutAnnee = new Date(maintenant.getFullYear(), 0, 1);

    const debut30Jours = new Date(maintenant);
    debut30Jours.setDate(maintenant.getDate() - 30);

    const [jour, semaine, mois, annee, trenteJours] = await Promise.all([
      this.calculerPeriode(debutJour),
      this.calculerPeriode(debutSemaine),
      this.calculerPeriode(debutMois),
      this.calculerPeriode(debutAnnee),
      this.chargerCommandes(debut30Jours),
    ]);

    this.caJour = jour.total;
    this.commandesJour = jour.nombre;

    this.caSemaine = semaine.total;
    this.commandesSemaine = semaine.nombre;

    this.caMois = mois.total;
    this.commandesMois = mois.nombre;

    this.caAnnee = annee.total;
    this.commandesAnnee = annee.nombre;

    this.commandesRecentes = trenteJours;
    this.calculerRepartitions(trenteJours);

    this.chargementTermine = true;
    this.cdr.detectChanges();
  }

  private async calculerPeriode(debut: Date): Promise<{ total: number; nombre: number }> {
    const { data, error } = await supabase
      .from('commandes')
      .select('total')
      .eq('restaurant_id', this.restaurantId)
      .gte('created_at', debut.toISOString());

    if (error) {
      console.error('Erreur lors du calcul du chiffre d\'affaires :', error);
      return { total: 0, nombre: 0 };
    }

    const total = data.reduce((somme, commande) => somme + commande.total, 0);
    return { total, nombre: data.length };
  }

  private async chargerCommandes(debut: Date): Promise<LigneCommande[]> {
    const { data, error } = await supabase
      .from('commandes')
      .select('total, moyen_paiement, plats, created_at, statut')
      .eq('restaurant_id', this.restaurantId)
      .gte('created_at', debut.toISOString());

    if (error) {
      console.error('Erreur lors du chargement des commandes :', error);
      return [];
    }

    return data as LigneCommande[];
  }

  private calculerRepartitions(commandes: LigneCommande[]) {
    const paiements = new Map<string, number>();
    const categories = new Map<string, number>();

    for (const commande of commandes) {
      const moyen = commande.moyen_paiement || 'Non spécifié';
      paiements.set(moyen, (paiements.get(moyen) || 0) + commande.total);

      for (const item of commande.plats) {
        const cat = item.plat?.categorie || 'Autres';
        const sousTotal = (item.plat as any)?.prix ? (item.plat as any).prix * item.quantite : 0;
        categories.set(cat, (categories.get(cat) || 0) + sousTotal);
      }
    }

    this.caParPaiement = Array.from(paiements.entries())
      .map(([moyen, total]) => ({ moyen, total }))
      .sort((a, b) => b.total - a.total);

    this.caParCategorie = Array.from(categories.entries())
      .map(([categorie, total]) => ({ categorie, total }))
      .sort((a, b) => b.total - a.total);
  }

  exporterCSV() {
    const lignes = [
      ['Date', 'Mode de paiement', 'Statut', 'Total (FCFA)'],
      ...this.commandesRecentes.map(c => [
        new Date(c.created_at).toLocaleString('fr-FR'),
        c.moyen_paiement || 'Non spécifié',
        c.statut,
        c.total.toString(),
      ]),
    ];

    const contenu = lignes.map(ligne => ligne.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `resta-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();

    URL.revokeObjectURL(url);
  }
}