import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 🚩 Quitamos NgClass de aquí
import { HttpClientModule } from '@angular/common/http'; // Añadimos HttpClientModule para consistencia

import { ProyectoService, ProyectoPublico } from '../../services/proyecto.service';
// 🚩 Importamos RouterLink de @angular/router para el uso de [routerLink]
import { RouterLink } from '@angular/router'; 

@Component({
  selector: 'app-ver-proyectos',
  standalone: true,
  // 🚩 CORRECCIÓN: Quitamos NgClass de imports
  imports: [CommonModule, RouterLink, HttpClientModule], 
  templateUrl: './verproyectos.html',
  styleUrls: ['./verproyectos.css']
})
export class VerProyectosComponent implements OnInit {

  proyectos: ProyectoPublico[] = [];
  subtemaSeleccionado: string = 'Todos';

  ultimosProyectos: ProyectoPublico[] = []; 
  proyectosAdicionales: ProyectoPublico[] = []; 

  proyectoSeleccionado: ProyectoPublico | null = null;

  constructor(private proyectoService: ProyectoService) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.proyectoService.listarProyectosPublicos().subscribe({
      next: (lista) => {
        this.proyectos = lista;
        
        // Lógica de separación de proyectos
        this.ultimosProyectos = lista.slice(0, 3); 
        this.proyectosAdicionales = lista.slice(3);
      },
      error: (err) => {
        console.error('Error listando proyectos públicos:', err);
      }
    });
  }

  filtrarPorSubtema(subtema: string): void {
    this.subtemaSeleccionado = subtema;
    this.proyectoSeleccionado = null;
  }

  savedProjects(): ProyectoPublico[] {
    if (this.subtemaSeleccionado === 'Todos') {
      return this.proyectos;
    }
    return this.proyectos.filter(p => p.actividad === this.subtemaSeleccionado);
  }

  verProyecto(p: ProyectoPublico): void {
    this.proyectoSeleccionado = p;
  }

  cerrarDetalle(): void {
    this.proyectoSeleccionado = null;
  }

  obtenerClaseEstatus(estado: string | null | undefined): string {
    const valor = (estado || '').toLowerCase();
    if (valor.includes('curso')) {
      return 'badge badge-encurso';
    }
    if (valor.includes('final')) {
      return 'badge badge-finalizado';
    }
    if (valor.includes('cancel')) {
      return 'badge badge-cancelado';
    }
    return 'badge badge-default';
  }
    
  // ❌ ELIMINAMOS obtenerFondoDinamico ya que su único propósito era alimentar [ngClass]
  // Si tu HTML de Proyectos usa esta función, tendrás que revisar la forma en que el color
  // se aplica en el HTML sin [ngClass].
  /*
  obtenerFondoDinamico(index: number): string {
    switch (index % 3) {
        case 0: return 'bg-primary-custom';
        case 1: return 'bg-dark';
        case 2: return 'bg-success-custom';
        default: return 'bg-secondary';
    }
  }
  */
  
  obtenerUrlImagen(url: string | null): string {
    return url || '/Imegenes/default_project.png';
  }

  previewFile(project: ProyectoPublico): void {
    if (!project.documentoUrl) { return; }

    const match = project.documentoUrl.match(/\/download\/(\d+)/);
    if (!match) { return; }

    const mediaId = match[1];
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const url = `http://${host}:8080/api/media/view/${mediaId}`;

    window.open(url, '_blank');
  }

  downloadFile(project: ProyectoPublico): void {
    if (!project.documentoUrl) return;

    let url = project.documentoUrl;

    if (!/^https?:\/\//i.test(url)) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      url = `http://${host}:8080${url}`;
    }

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  }
}