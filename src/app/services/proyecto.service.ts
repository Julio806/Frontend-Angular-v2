import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MediaFile {
  id: number;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface Proyecto {
  id?: number;
  nombre: string;
  descripcion: string;
  actividad?: string;
  necesidad?: string;
  estadoProyecto?: string;
  fechaInicio?: string;
  fechaFin?: string;
  empresaVinculada?: string;
  tecnologico?: { id: number } | null;
  medias?: MediaFile[];
}

export interface ProyectoPublico {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  empresaVinculada: string;
  tecnologico: string;
  actividad: string;
  imagenUrl: string | null;
  documentoUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProyectoService {

  private readonly host =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  private apiUrl = `http://${this.host}:8080/api`;
  // Definimos la URL base para el endpoint de proyectos
  private proyectosUrl = `${this.apiUrl}/proyectos`; 

  constructor(private http: HttpClient) { }

  // ---- Proyectos CRUD ----

  listarProyectos(): Observable<Proyecto[]> {
    // Usamos la variable proyectosUrl
    return this.http.get<Proyecto[]>(this.proyectosUrl);
  }

  crearProyecto(proyecto: Proyecto): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.proyectosUrl, proyecto);
  }

  actualizarProyecto(id: number, proyecto: Proyecto): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.proyectosUrl}/${id}`, proyecto);
  }

  eliminarProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.proyectosUrl}/${id}`);
  }

  // ---- Documentos (Media) ----

  listarDocumentos(proyectoId: number): Observable<MediaFile[]> {
    return this.http.get<MediaFile[]>(`${this.apiUrl}/media/por-proyecto/${proyectoId}`);
  }

  subirDocumento(file: File, proyectoId: number, uploaderId: number): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('proyectoId', proyectoId.toString());
    formData.append('uploaderId', uploaderId.toString());

    return this.http.post<MediaFile>(`${this.apiUrl}/media/upload`, formData);
  }

  descargarDocumento(mediaId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/media/download/${mediaId}`, {
      responseType: 'blob'
    });
  }

  eliminarDocumento(mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/media/${mediaId}`);
  }

  actualizarDocumento(mediaId: number, file: File): Observable<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<MediaFile>(`${this.apiUrl}/media/${mediaId}`, formData);
  }

  // ---- Proyectos públicos (página informativa) ----
  listarProyectosPublicos(): Observable<ProyectoPublico[]> {
    const serverBase = `http://${this.host}:8080`;

    return this.http
      .get<ProyectoPublico[]>(`${this.apiUrl}/public/proyectos`)
      .pipe(
        map(proyectos =>
          proyectos.map(p => ({
            ...p,
            imagenUrl: p.imagenUrl ? `${serverBase}${p.imagenUrl}` : null,
            documentoUrl: p.documentoUrl ? `${serverBase}${p.documentoUrl}` : null
          }))
        )
      );
  }
    
  // 🚩 MÉTODO AÑADIDO: Llama al endpoint /api/proyectos/latest
  listarUltimosTresProyectos(): Observable<ProyectoPublico[]> {
      const url = `${this.proyectosUrl}/latest`; // Combina /api/proyectos con /latest

      // Este endpoint devuelve ProyectoDTO (ProyectoPublico en Angular)
      return this.http.get<ProyectoPublico[]>(url);
  }
}