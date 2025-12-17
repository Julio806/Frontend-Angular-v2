import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // <-- Se agregaron Inject y PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common';      // <-- Se agregó isPlatformBrowser
import { FormsModule } from '@angular/forms';
import { ProyectoService, Proyecto, MediaFile } from '../../../services/proyecto.service';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos.html',
  styleUrls: ['./proyectos.css']
})
export class ProyectosComponent implements OnInit {

  proyectos: Proyecto[] = [];

  proyectoSeleccionado: Proyecto | null = null;
  proyectoEnEdicion: Proyecto | null = null;

  documentos: MediaFile[] = [];
  archivoSeleccionado: File | null = null;
  mostrarModalDocs = false;

  docParaActualizar: MediaFile | null = null;
  archivoParaActualizar: File | null = null;

  // 👇 base para armar URLs de media (Ahora inyectado en constructor)
  private readonly host: string;
  private readonly mediaBaseUrl: string;

  // INYECCIÓN DE PLATFORM_ID
  constructor(
    private proyectoService: ProyectoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inicialización segura de host fuera del navegador
    this.host = isPlatformBrowser(this.platformId) ? window.location.hostname : 'localhost';
    this.mediaBaseUrl = `http://${this.host}:8080/api/media`;
  }

  ngOnInit(): void {
    // ENVOLVER CARGA INICIAL (Resuelve 403 y cualquier uso de localStorage)
    if (isPlatformBrowser(this.platformId)) {
      this.cargarProyectos();
    }
  }

  // --- GETTERS PARA SEPARAR IMÁGENES Y DOCUMENTOS ---

  esImagen(doc: MediaFile): boolean {
    return !!doc.fileType && doc.fileType.startsWith('image/');
  }

  get imagenes(): MediaFile[] {
    return this.documentos.filter(d => this.esImagen(d));
  }

  get otrosDocumentos(): MediaFile[] {
    return this.documentos.filter(d => !this.esImagen(d));
  }

  getMediaUrl(doc: MediaFile): string {
    return `${this.mediaBaseUrl}/view/${doc.id}`;
  }

  // --- CRUD PROYECTOS / ARCHIVOS ---

  cargarProyectos(): void {
    this.proyectoService.listarProyectos().subscribe({
      next: (lista) => { this.proyectos = lista; },
      error: (err) => console.error('Error listando proyectos:', err)
    });
  }

  abrirModalDocumentos(p: Proyecto): void {
    this.proyectoSeleccionado = p;
    this.proyectoEnEdicion = { ...p };
    this.mostrarModalDocs = true;
    this.cargarDocumentos();
  }

  cerrarModalDocumentos(): void {
    this.mostrarModalDocs = false;
    this.proyectoSeleccionado = null;
    this.proyectoEnEdicion = null;
    this.documentos = [];
    this.archivoSeleccionado = null;
    this.docParaActualizar = null;
    this.archivoParaActualizar = null;
  }

  cargarDocumentos(): void {
    if (!this.proyectoSeleccionado?.id) return;

    this.proyectoService.listarDocumentos(this.proyectoSeleccionado.id).subscribe({
      next: (docs) => this.documentos = docs,
      error: (err) => console.error('Error listando documentos:', err)
    });
  }

  onFileChangeNuevo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.archivoSeleccionado = file;
  }

  subirDocumento(): void {
    if (!this.archivoSeleccionado || !this.proyectoSeleccionado?.id) return;

    const uploaderId = 1; // TODO: id del usuario logueado
    this.proyectoService.subirDocumento(
      this.archivoSeleccionado,
      this.proyectoSeleccionado.id,
      uploaderId
    ).subscribe({
      next: () => {
        this.archivoSeleccionado = null;
        
        // AISLAR MANIPULACIÓN DEL DOM
        if (isPlatformBrowser(this.platformId)) {
          const input = document.getElementById('fileInputDocsNuevo') as HTMLInputElement | null;
          if (input) input.value = '';
        }

        this.cargarDocumentos();
      },
      error: (err) => console.error('Error subiendo documento:', err)
    });
  }

  guardarCambiosProyecto(): void {
    if (!this.proyectoEnEdicion?.id) return;

    this.proyectoService.actualizarProyecto(this.proyectoEnEdicion.id, this.proyectoEnEdicion).subscribe({
      next: (proyActualizado) => {
        const idx = this.proyectos.findIndex(p => p.id === proyActualizado.id);
        if (idx !== -1) this.proyectos[idx] = proyActualizado;
        this.proyectoSeleccionado = proyActualizado;
        this.proyectoEnEdicion = { ...proyActualizado };
        
        // AISLAR LLAMADA A 'alert'
        if (isPlatformBrowser(this.platformId)) {
          alert('Proyecto actualizado correctamente.');
        }
      },
      error: (err) => {
        console.error('Error actualizando proyecto:', err);
        // AISLAR LLAMADA A 'alert'
        if (isPlatformBrowser(this.platformId)) {
          alert('Ocurrió un error al actualizar el proyecto.');
        }
      }
    });
  }

  verDocumento(doc: MediaFile): void {
    // AISLAR USO DE 'window.open'
    if (isPlatformBrowser(this.platformId)) {
      const url = this.getMediaUrl(doc);
      window.open(url, '_blank');
    }
  }

  descargarDocumento(doc: MediaFile): void {
    // AISLAR USO DE 'window.URL' y 'document'
    if (!isPlatformBrowser(this.platformId)) return;

    this.proyectoService.descargarDocumento(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'archivo';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando documento:', err)
    });
  }

  eliminarDocumento(doc: MediaFile): void {
    // 💥 CORRECCIÓN FALTANTE: AISLAR USO DE 'confirm'
    if (isPlatformBrowser(this.platformId)) {
      if (!confirm(`¿Eliminar el archivo "${doc.fileName}"?`)) return;
    } else {
      // Si estamos en el servidor, no podemos preguntar. Omitimos la operación.
      return; 
    }

    this.proyectoService.eliminarDocumento(doc.id).subscribe({
      next: () => this.cargarDocumentos(),
      error: (err) => console.error('Error eliminando documento:', err)
    });
  }

  seleccionarDocParaActualizar(doc: MediaFile): void {
    this.docParaActualizar = doc;
    this.archivoParaActualizar = null;
    
    // AISLAR ACCESO AL DOM
    if (isPlatformBrowser(this.platformId)) {
      const input = document.getElementById('fileInputUpdate') as HTMLInputElement | null;
      if (input) input.value = '';
    }
  }

  onFileChangeActualizar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.archivoParaActualizar = file;
  }

  actualizarDocumento(): void {
    if (!this.docParaActualizar || !this.archivoParaActualizar) return;

    this.proyectoService.actualizarDocumento(this.docParaActualizar.id, this.archivoParaActualizar).subscribe({
      next: () => {
        this.docParaActualizar = null;
        this.archivoParaActualizar = null;
        
        // AISLAR ACCESO AL DOM Y 'alert'
        if (isPlatformBrowser(this.platformId)) {
           const input = document.getElementById('fileInputUpdate') as HTMLInputElement | null;
           if (input) input.value = '';
           this.cargarDocumentos();
           alert('Archivo actualizado correctamente.');
        }
      },
      error: (err) => {
        console.error('Error actualizando documento:', err);
        if (isPlatformBrowser(this.platformId)) {
          alert('Ocurrió un error al actualizar el archivo.');
        }
      }
    });
  }
}