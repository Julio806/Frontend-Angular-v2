import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class Inicio {
  coordinador = (typeof window !== 'undefined' && localStorage.getItem('nombre')) || 'Coordinador';
  proyectos = 12;
  avances = 8;
  reportes = 5;
}
