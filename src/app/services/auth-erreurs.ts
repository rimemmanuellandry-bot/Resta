import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class AuthErreursService {
  constructor(private translate: TranslateService) {}

  // Traduit les messages d'erreur Supabase (toujours renvoyés en anglais brut par l'API)
  traduire(message: string): string {
    const m = message.toLowerCase();

    if (m.includes('already registered') || m.includes('already exists')) {
      return this.translate.instant('authErreurs.userAlreadyRegistered');
    }
    if (m.includes('invalid login credentials')) {
      return this.translate.instant('authErreurs.invalidCredentials');
    }
    if (m.includes('unable to validate email') || m.includes('invalid email')) {
      return this.translate.instant('authErreurs.emailInvalide');
    }
    if (m.includes('password should be at least') || m.includes('weak password')) {
      return this.translate.instant('authErreurs.motDePasseFaible');
    }
    if (m.includes('rate limit')) {
      return this.translate.instant('authErreurs.tropDeTentatives');
    }
    if (m.includes('email not confirmed')) {
      return this.translate.instant('authErreurs.emailNonConfirme');
    }

    return this.translate.instant('authErreurs.defaut');
  }
}