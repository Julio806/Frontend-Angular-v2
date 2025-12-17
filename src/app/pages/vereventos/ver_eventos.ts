import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 

// Importamos la interfaz y el servicio
import { EventoService, IEventoVisualizacion } from '../../services/eventos.service';


@Component({
  selector: 'app-ver-eventos',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule], 
  templateUrl: './ver_eventos.html',
  styleUrls: ['./ver_eventos.css']
})
export class VerEventosComponent implements OnInit {

  // Propiedades de ESTADO DE CARGA
    cargando: boolean = true;
    errorCarga: string | null = null;
    // ------------------------------------

  // Usamos la interfaz importada del servicio
  eventos: IEventoVisualizacion[] = [];
  
  // Evento actualmente abierto en detalle (no se usa en este diseño de lista, pero se mantiene)
  eventoSeleccionado: IEventoVisualizacion | null = null;
  
  // URL base para acceder a los archivos estáticos de Spring Boot
  public mediaUrlBase = 'http://localhost:8080/uploads/';

  // Inyección de dependencias
  constructor(private eventoService: EventoService) {} 

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    // 1. Iniciar la carga y limpiar errores
    this.cargando = true;
    this.errorCarga = null;

    this.eventoService.listarTodos().subscribe({
      next: (lista: IEventoVisualizacion[]) => { 
        // 🚩 1. ORDENAMIENTO CRÍTICO: El más reciente primero (Descendente)
        this.eventos = lista.sort((a, b) => {
            const dateA = new Date(a.fechaInicio).getTime();
            const dateB = new Date(b.fechaInicio).getTime();
            return dateB - dateA; 
        });
        this.cargando = false; // 2. Finalizar la carga
      },
      error: (err: any) => { 
        console.error('Error listando eventos:', err);
        this.cargando = false; // 3. Finalizar la carga
        this.errorCarga = 'No se pudieron cargar los eventos. Verifique el Backend.'; // 4. Asignar el error
        alert('Error al cargar eventos. Verifique el servidor.');
      }
    });
  }

  savedEvents(): IEventoVisualizacion[] {
    return this.eventos;
  }

  verEvento(e: IEventoVisualizacion): void {
    this.eventoSeleccionado = e;
  }

  cerrarDetalle(): void {
    this.eventoSeleccionado = null;
  }

  // 🚩 NUEVO MÉTODO PARA VISUALIZAR DOCUMENTO (PDF/Presentación)
  visualizarDocumento(evento: IEventoVisualizacion): void {
    if (!evento.rutaEvidencia) return;

    const url = this.obtenerUrlEvidencia(evento.rutaEvidencia); 
    window.open(url, '_blank');
  }
  
  // ------------------------------------

  downloadFile(evento: IEventoVisualizacion): void {
    if (!evento.rutaEvidencia) return;

    // Construye la URL completa usando rutaEvidencia (el documento)
    const url = this.mediaUrlBase + evento.rutaEvidencia;

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
  }
  
  // Función auxiliar para obtener la URL completa de la evidencia (para el HTML)
  obtenerUrlEvidencia(nombreArchivo: string): string {
    return `${this.mediaUrlBase}${nombreArchivo}`;
  }
}