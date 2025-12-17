import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
// Si usas el EventoService, deberías importarlo aquí en lugar de HttpClient directamente.

// 1. Interfaces corregidas para ser solo metadata
export interface IEvento {
    nombreEvento: string; // Corresponde al campo 'nombre' en el Backend
    tipo: string;
    fechaHorario: string; // Corresponde a 'fechaInicio' y 'fechaFin'
    sede: string;         // Corresponde a 'lugar'
    organizador: string;
    objetivo: string;
    publicoObjetivo: string;
    programa: string;
    ponentes: string;
    requisitos: string;
    materiales: string;
    enlaceExterno: string | null; // 🚩 NUEVO CAMPO URL
}

/** Estructura de la respuesta esperada de Spring Boot */
interface EventoResponse {
  id_evento?: number;
  [key: string]: any;
}


@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], 
  templateUrl: './eventos.html',
  styleUrls: ['./eventos.css']
})
export class EventosComponent implements OnInit {

  // URL del endpoint de tu API REST de Spring Boot
  private apiUrl = 'http://localhost:8080/api/eventos'; 

  evento: IEvento = {
    nombreEvento: '',
    tipo: '',
    fechaHorario: '',
    sede: '',
    organizador: '',
    objetivo: '',
    publicoObjetivo: '',
    programa: '',
    ponentes: '',
    requisitos: '',
    materiales: '',
    enlaceExterno: null // Inicializado correctamente
  };

  // 🚩 VARIABLES DE ESTADO PARA LOS ARCHIVOS
  archivoImagen: File | null = null;
  archivoDocumento: File | null = null; 
  // ----------------------------------------

  tiposEvento: string[] = [
    'Taller', 'Congreso', 'Foro', 'Expo', 'Seminario', 'Curso'
  ];

  constructor(private http: HttpClient) { }
  
  ngOnInit(): void {
    // Lógica de inicialización
  }

  // 🚩 MANEJADOR DE CAMBIO PARA LA IMAGEN PRINCIPAL
  seleccionarImagen(event: any) {
    this.archivoImagen = event.target.files[0] || null;
  }
  
  // 🚩 MANEJADOR DE CAMBIO PARA EL DOCUMENTO/EVIDENCIA
  seleccionarDocumento(event: any) {
    this.archivoDocumento = event.target.files[0] || null;
  }
  
  // ❌ Eliminar la función seleccionarArchivo() antigua.

  guardarEvento(): void {
    
    // --- 1. Validaciones básicas ---
    if (!this.evento.nombreEvento || !this.evento.tipo) {
        alert('Por favor, complete los campos Nombre y Tipo.');
        return;
    }
    
    // --- 2. Crear el objeto FormData ---
    const formData = new FormData();

    // --- 3. Mapear y adjuntar los archivos (CRÍTICO: Coincidencia con Spring) ---
    // El nombre ('imagen') DEBE coincidir con @RequestPart(value = "imagen")
    if (this.archivoImagen) {
      formData.append('imagen', this.archivoImagen, this.archivoImagen.name);
    }
    
    // El nombre ('documento') DEBE coincidir con @RequestPart(value = "documento")
    if (this.archivoDocumento) {
      formData.append('documento', this.archivoDocumento, this.archivoDocumento.name);
    }

    // --- 4. Mapear y adjuntar los datos del formulario (Metadata JSON) ---
    // Aseguramos que los nombres coincidan con la Entidad Eventos.java
    const metadataEvento = {
        nombre: this.evento.nombreEvento,
        tipo: this.evento.tipo,
        fechaInicio: this.evento.fechaHorario, 
        fechaFin: this.evento.fechaHorario,    
        lugar: this.evento.sede,               
        organizador: this.evento.organizador,
        objetivo: this.evento.objetivo,
        publicoObjetivo: this.evento.publicoObjetivo,
        programa: this.evento.programa,
        ponentes: this.evento.ponentes,
        requisitos: this.evento.requisitos,
        materiales: this.evento.materiales,
        enlaceExterno: this.evento.enlaceExterno // 🚩 URL externa
    };

    // El nombre ('evento') DEBE coincidir con @RequestPart("evento")
    formData.append('evento', new Blob([JSON.stringify(metadataEvento)], {
        type: 'application/json'
    }));

    // --- 5. Enviar la solicitud POST ---
    this.http.post<EventoResponse>(this.apiUrl, formData).subscribe({
      next: (response) => {
        const id = response?.id_evento ?? '(sin id)';
        alert(`Evento creado exitosamente ${id}`);
        console.log('Evento guardado:', response);
        // Opcional: Resetear el formulario y los archivos aquí
      },
      error: (error) => {
        alert('Error al crear el evento. Revisa la consola y el Backend.');
        console.error('Error del Backend:', error);
      }
    });
  }
}