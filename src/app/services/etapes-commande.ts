import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class EtapesCommandeService {
  // Les clés à gauche sont les valeurs stockées en base (ne pas traduire, logique métier)
  private cles: Record<string, string> = {
    'reçue': 'etapes.recue',
    'en préparation': 'etapes.enPreparation',
    'prête': 'etapes.prete',
    'servie': 'etapes.servie',
    'en route': 'etapes.enRoute',
    'livrée': 'etapes.livree',
  };

  constructor(private translate: TranslateService) {}

  libelle(etapeBrute: string): string {
    const cle = this.cles[etapeBrute];
    return cle ? this.translate.instant(cle) : etapeBrute;
  }
}