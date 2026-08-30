import { Component } from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scan-qr',
  imports: [ZXingScannerModule],
  templateUrl: './scan-qr.html',
  styleUrl: './scan-qr.css',
})
export class ScanQr {
  constructor(private router: Router) {}

  onScanSuccess(result: string) {
    console.log('QR scanné :', result);
    // On redirige vers le menu en transmettant le contenu scanné comme numéro de table
    this.router.navigate(['/menu'], { queryParams: { table: result } });
  }
}