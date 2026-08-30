import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiKey = 'TA_CLE_API_ICI';
  private siteId = 'TON_SITE_ID_ICI';
  private apiUrl = 'https://api-checkout.cinetpay.com/v2/payment';

  async initierPaiement(montant: number, commandeId: number, telephone: string): Promise<string | null> {
    const transactionId = 'resta-' + commandeId + '-' + Date.now();

    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
      amount: montant,
      currency: 'XAF',
      description: 'Commande Resta #' + commandeId,
      customer_phone_number: telephone,
      notify_url: 'https://ton-domaine.com/api/cinetpay-webhook',
      return_url: 'https://ton-domaine.com/commande-status',
      channels: 'MOBILE_MONEY',
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.code === '201') {
        return result.data.payment_url;
      } else {
        console.error('Erreur CinetPay :', result);
        return null;
      }
    } catch (error) {
      console.error('Erreur réseau lors du paiement :', error);
      return null;
    }
  }
}