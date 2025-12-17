import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel.html',
  styleUrls: ['./panel.css']
})
export class PanelComponent {

  usuario: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Aquí podrías cargar datos del usuario logueado desde localStorage o el backend
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt');
      if (!token) {
        this.router.navigate(['/login']); // 🚪 redirige si no hay sesión
      }
      this.usuario = 'Administrador TEC Frontera Comalapa'; // ejemplo temporal
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt');
    }
    this.router.navigate(['/login']);
  }
}
