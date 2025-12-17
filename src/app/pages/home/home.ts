import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { HttpClientModule } from '@angular/common/http'; 

// Importaciones de Eventos
import { EventoService, IEventoVisualizacion } from '../../services/eventos.service';
// 🚩 AÑADIDO: Importamos ProyectoService y la interfaz ProyectoPublico
import { ProyectoService, ProyectoPublico } from '../../services/proyecto.service'; 

@Component({
  selector: 'app-home',
  standalone: true,
  // 🚩 Añadimos HttpClientModule (si tu aplicación no lo provee globalmente) y EventoService
  imports: [CommonModule, RouterLink, HttpClientModule], 
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  providers: [EventoService, ProyectoService] // Se recomienda proveer el servicio si no está en 'root'
})
export class Home implements OnInit {
  protected readonly title = signal('CafeHub');

  // =========================================================
  // 🚩 PROPIEDADES DE ESTADO DEL EVENTO (ORIGINALES - INTACTAS)
  ultimosEventos: IEventoVisualizacion[] = [];
  cargando: boolean = true;
  // -------------------------------------

  // =========================================================
  // 🚩 PROPIEDADES PARA PROYECTOS (AÑADIDAS)
  proyectos: ProyectoPublico[] = []; 
  // -------------------------------------

  // 🚩 CONSTRUCTOR (MODIFICADO para inyectar ProyectoService)
  constructor(
    private eventoService: EventoService,
    private proyectoService: ProyectoService // 🚩 AÑADIDO
    ) { }

  ngOnInit(): void {
    this.cargarUltimosEventos();
    this.cargarProyectos(); // 🚩 CARGA DE PROYECTOS AÑADIDA
  }

  // 🚩 LÓGICA DE CARGA DE EVENTOS (ORIGINAL - INTACTA)
  cargarUltimosEventos(): void {
    this.cargando = true;
    this.eventoService.listarUltimosTres().subscribe({
      next: (eventos) => {
        this.ultimosEventos = eventos.slice(0, 3);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando últimos eventos:', err);
        this.cargando = false;
      }
    });
  }

  // 🚩 FUNCIONES AUXILIARES PARA EL HTML (ORIGINALES - INTACTAS)
  obtenerUrlEvidencia(nombreArchivo: string): string {
    return `http://localhost:8080/uploads/${nombreArchivo}`; 
  }

  formatearDia(fechaStr: string): string {
    if (!fechaStr) return 'XX';
    const date = new Date(fechaStr);
    return date.getDate().toString();
  }

  formatearMes(fechaStr: string): string {
    if (!fechaStr) return 'Mes';
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const date = new Date(fechaStr);
    return meses[date.getMonth()];
  }
    
  // =========================================================
  // 🚩 LÓGICA DE CARGA DE PROYECTOS (AÑADIDA)
  // =========================================================
  cargarProyectos(): void {
    this.proyectoService.listarProyectosPublicos().subscribe({
      next: (lista) => {
        this.proyectos = lista;
      },
      error: (err) => {
        console.error('Error listando proyectos públicos:', err);
      }
    });
  }

  // =========================================================
  // 🚩 FUNCIONES AUXILIARES DE PROYECTOS (AÑADIDAS para el HTML)
  // =========================================================

    verProyecto(p: ProyectoPublico): void {
        console.log('Ver Proyecto:', p.nombre); 
    }

    obtenerUrlImagen(url: string | null): string {
        return url || '/Imegenes/default_project.png';
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

    // Usado por [ngClass] en el HTML de proyectos
    obtenerFondoDinamico(index: number): string {
        switch (index % 3) {
            case 0: return 'bg-primary-custom';
            case 1: return 'bg-dark';
            case 2: return 'bg-success-custom';
            default: return 'bg-secondary';
        }
    }
    
    downloadFile(project: ProyectoPublico): void {
        if (!project.documentoUrl) return;

        let url = project.documentoUrl;
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        url = `http://${host}:8080${url}`; 
        
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
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
}