import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inscription/inscription').then(m => m.Inscription),
  },
  {
    path: 'connexion',
    loadComponent: () => import('./pages/connexion/connexion').then(m => m.Connexion),
  },
  {
    path: 'bienvenue',
    loadComponent: () => import('./pages/accueil/accueil').then(m => m.Accueil),
  },
  {
    path: 'localite',
    loadComponent: () => import('./pages/localite/localite').then(m => m.Localite),
  },
  {
    path: 'restaurant',
    loadComponent: () => import('./pages/restaurant/restaurant').then(m => m.Restaurant),
  },
  {
    path: 'reservation',
    loadComponent: () => import('./pages/reservation/reservation').then(m => m.Reservation),
  },
  {
    path: 'scan',
    loadComponent: () => import('./pages/scan-qr/scan-qr').then(m => m.ScanQr),
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu').then(m => m.Menu),
  },
  {
    path: 'panier',
    loadComponent: () => import('./pages/panier/panier').then(m => m.Panier),
  },
  {
    path: 'commande-status',
    loadComponent: () => import('./pages/commande-status/commande-status').then(m => m.CommandeStatus),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.Admin),
    canActivate: [adminGuard],
  },
  {
    path: 'statistiques',
    loadComponent: () => import('./pages/statistiques/statistiques').then(m => m.Statistiques),
    canActivate: [adminGuard],
  },
];