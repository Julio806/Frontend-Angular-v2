import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// Importa la interfaz del formulario si la tienes


// 1. INTERFAZ PARA VISUALIZACIÓN (Debe coincidir con la entidad Eventos.java)
export interface IEventoVisualizacion {
  id_evento: number;
  nombre: string;
  tipo: string;
  fechaInicio: string; 
  fechaFin: string;
  lugar: string;
  organizador: string;
  objetivo: string;
  publicoObjetivo: string;
  programa: string;
  ponentes: string;
  requisitos: string;
  materiales: string;
  rutaEvidencia: string | null; 
  // 🚩 CAMPOS AÑADIDOS
  rutaImagen: string | null;      // Nombre del archivo de imagen principal
  enlaceExterno: string | null;   // URL externa (ej. Facebook)
}


@Injectable({ providedIn: 'root' })
export class EventoService {

  // Usa el mismo patrón de host/puerto que tu ProyectoService
  private readonly host =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  private apiUrl = `http://${this.host}:8080/api`;
  private eventosUrl = `${this.apiUrl}/eventos`; // Endpoint: /api/eventos

  constructor(private http: HttpClient) { }

  // ------------------------------------
  // ---- 2. CRUD y Listado Principal ----
  // ------------------------------------

  /**
   * Lista todos los eventos (usado en ver_eventos.component.ts).
   * Requiere autenticación (Token JWT) en el Backend.
   */
  listarTodos(): Observable<IEventoVisualizacion[]> {
    
    // **NOTA DE SEGURIDAD:** Si tienes el error 403, debes añadir el token aquí.
    const token = (typeof window !== 'undefined' && typeof localStorage !== 'undefined') ? localStorage.getItem('jwt_token') : null; // O donde lo almacenes
    let headers = new HttpHeaders();
    if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Llama a GET /api/eventos
    return this.http.get<IEventoVisualizacion[]>(this.eventosUrl, { headers: headers });
  }

  /**
   * Crea un nuevo evento, incluyendo los metadatos y la evidencia (MultipartForm-Data).
   * El parámetro es el FormData ya construido en el componente.
   */
  crearEvento(formData: FormData): Observable<IEventoVisualizacion> {
    // Llama a POST /api/eventos (Este endpoint es el que recibe el FormData)
    // Spring Security requerirá Token aquí si está protegida.
    return this.http.post<IEventoVisualizacion>(this.eventosUrl, formData);
  }

  // 🚩 NUEVO MÉTODO: Llama al endpoint de últimos 3 eventos
    listarUltimosTres(): Observable<IEventoVisualizacion[]> {
        const url = `${this.eventosUrl}/latest`; // Llama a /api/eventos/latest
        return this.http.get<IEventoVisualizacion[]>(url);
    }

  // ------------------------------------
  // ---- 3. Funciones de Visualización Pública (Opcional) ----
  // ------------------------------------

  /**
   * Lista eventos públicos (si tu backend tiene un endpoint público diferente).
   */
  listarEventosPublicos(): Observable<IEventoVisualizacion[]> {
    // Asumimos que este endpoint NO requiere autenticación: /api/public/eventos
    const publicUrl = `${this.apiUrl}/public/eventos`; 
    const serverBase = `http://${this.host}:8080`;

    return this.http
      .get<IEventoVisualizacion[]>(publicUrl)
      .pipe(
        map(eventos =>
          eventos.map(e => ({
            ...e,
            // Construye la URL completa para rutaImagen
            rutaImagen: e.rutaImagen ? `${serverBase}/uploads/${e.rutaImagen}` : null,
            rutaEvidencia: e.rutaEvidencia ? `${serverBase}/uploads/${e.rutaEvidencia}` : null,
          }))
        )
      );
  }
}