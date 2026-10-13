import { Injectable } from '@angular/core';

export interface CoordonneesGps {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  /**
   * Obtient la position GPS actuelle de l'utilisateur via l'API Geolocation du navigateur
   */
  async obtenirPositionActuelle(): Promise<CoordonneesGps> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('La géolocalisation n\'est pas supportée par votre navigateur.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Calcule la distance en kilomètres entre deux coordonnées géographiques (formule de Haversine)
   */
  calculerDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon moyen de la Terre en kilomètres
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formate la distance : affiche en mètres si < 1 km (ex: "650 m"), sinon en kilomètres (ex: "1.4 km")
   */
  formaterDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      const metres = Math.round(distanceKm * 1000);
      return `${metres} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }
}
