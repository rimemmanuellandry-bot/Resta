import { Injectable } from '@angular/core';

export interface Plat {
  id: number;
  nom: string;
  prix: number;
  description: string;
  categorie: string;
  image_url: string;
}

export interface ArticlePanier {
  plat: Plat;
  quantite: number;
}

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  panier: ArticlePanier[] = [];
  table: string | null = null;
  commandeId: number | null = null;
  mode: 'sur_place' | 'livraison' = 'sur_place';
  adresse: string = '';
  telephone: string = '';
  moyenPaiement: 'orange_money' | 'mtn_momo' | null = null;
  telephonePaiement: string = '';
   allergies: string = '';
   restaurantId: string | null = null;
  setTable(numero: string) {
    this.table = numero;
  }

  ajouter(plat: Plat) {
    const existant = this.panier.find(item => item.plat.id === plat.id);
    if (existant) {
      existant.quantite++;
    } else {
      this.panier.push({ plat, quantite: 1 });
    }
  }

  retirerUn(id: number) {
    const existant = this.panier.find(item => item.plat.id === id);
    if (existant) {
      existant.quantite--;
      if (existant.quantite <= 0) {
        this.panier = this.panier.filter(item => item.plat.id !== id);
      }
    }
  }

  vider() {
    this.panier = [];
      this.adresse = '';
    this.telephone = '';
    this.allergies = ''; 
  }

  getTotal(): number {
    return this.panier.reduce((total, item) => total + item.plat.prix * item.quantite, 0);
  }
}