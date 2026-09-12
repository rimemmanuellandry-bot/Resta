import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class FactureService {
  constructor(private translate: TranslateService) {}

  async telecharger(commande: any) {
    if (!commande) {
      return;
    }

    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    let y = 20;

    const langue = this.translate.currentLang() || 'fr';
    const localeDate = langue === 'en' ? 'en-US' : 'fr-FR';

    doc.setFontSize(18);
    doc.text(this.translate.instant('facture.titreDocument'), 20, y);
    y += 12;

    doc.setFontSize(11);
    doc.text(`${this.translate.instant('facture.commandeNumero')} ${commande.id}`, 20, y);
    y += 7;
    doc.text(`${this.translate.instant('facture.dateLabel')} ${new Date(commande.created_at).toLocaleString(localeDate)}`, 20, y);
    y += 7;
    doc.text(`${this.translate.instant('facture.modeLabel')} ${commande.mode === 'livraison' ? this.translate.instant('facture.modeLivraison') : this.translate.instant('facture.modeSurPlace')}`, 20, y);
    y += 7;

    if (commande.mode === 'livraison') {
      doc.text(`${this.translate.instant('facture.adresseLabel')} ${commande.adresse}`, 20, y);
      y += 7;
      doc.text(`${this.translate.instant('facture.telephoneLabel')} ${commande.telephone}`, 20, y);
      y += 7;
    } else {
      doc.text(`${this.translate.instant('facture.tableLabel')} ${commande.table_numero}`, 20, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.text(this.translate.instant('facture.detailTitre'), 20, y);
    y += 8;
    doc.setFontSize(11);

    for (const item of commande.plats) {
      const sousTotal = item.plat.prix * item.quantite;
      doc.text(`${item.plat.nom}  x${item.quantite}`, 20, y);
      doc.text(`${sousTotal} FCFA`, 160, y);
      y += 7;
    }

    y += 6;
    doc.setFontSize(13);
    doc.text(`${this.translate.instant('facture.totalLabel')} ${commande.total} FCFA`, 20, y);
    y += 10;

    if (commande.allergies) {
      doc.setFontSize(10);
      doc.text(`${this.translate.instant('facture.allergiesLabel')} ${commande.allergies}`, 20, y);
      y += 7;
    }

    doc.setFontSize(9);
    doc.text(this.translate.instant('facture.merci'), 20, y + 10);

    doc.save(`facture-commande-${commande.id}.pdf`);
  }
}