import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
})
export class Accueil {}