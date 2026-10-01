import { Component } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-scan-qr',
  imports: [ZXingScannerModule, TranslatePipe],
  templateUrl: './scan-qr.html',
  styleUrl: './scan-qr.css',
})
export class ScanQr {
  constructor(private router: Router) {}

  onScanSuccess(result: string) {
    if (!result) {
      return;
    }
    const contenu = result.trim();
    console.log('QR scanné :', contenu);

    let table = contenu;
    let restaurantId: string | null = null;

    // 1. Détection format JSON (ex: {"table": "4", "restaurant_id": "2"})
    if (contenu.startsWith('{') && contenu.endsWith('}')) {
      try {
        const obj = JSON.parse(contenu);
        if (obj.table) {
          table = String(obj.table);
        }
        if (obj.restaurant_id) {
          restaurantId = String(obj.restaurant_id);
        }
      } catch {
        // Ignorer si ce n'est pas un JSON valide
      }
    } else if (contenu.includes('?') || contenu.startsWith('http://') || contenu.startsWith('https://')) {
      // 2. Détection format URL (ex: https://resta.app/menu?table=4&restaurant_id=2)
      try {
        const url = new URL(contenu, 'https://resta.app');
        const urlTable = url.searchParams.get('table');
        const urlResto = url.searchParams.get('restaurant_id');
        if (urlTable) {
          table = urlTable;
        }
        if (urlResto) {
          restaurantId = urlResto;
        }
      } catch {
        // Conserver le contenu brut si URL mal formée
      }
    }

    const queryParams: Record<string, string> = { table };
    if (restaurantId) {
      queryParams['restaurant_id'] = restaurantId;
    }

    this.router.navigate(['/menu'], { queryParams });
  }
}