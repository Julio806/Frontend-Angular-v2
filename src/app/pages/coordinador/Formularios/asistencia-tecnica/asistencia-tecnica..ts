import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface IAsistenciaTecnica {
  // Ficha institución
  nombreInstitucion: string; // Cambiado de '' a string
  tipoAsistencia: string;    // Cambiado de '' a string
  especialistas: string;    // Cambiado de '' a string
  regionOperacion: string;  // Cambiado de '' a string
  requisitosServicio: string; // Cambiado de '' a string
  capacidadAtencion: string; // Cambiado de '' a string
  costos: string;          // Cambiado de '' a string
  documentosInstitucionales: File | null;

  // Ficha solicitud
  nombreSolicitante: string; // Cambiado de '' a string
  tipoSolicitante: string;    // <-- CORRECCIÓN CLAVE: Cambiado de '' a string
  tipoSolicitanteOtro: string; // Nuevo campo para la especificación
  problemaEspecifico: string; // Cambiado de '' a string
  ubicacion: string;          // Cambiado de '' a string
}

@Component({
  selector: 'app-asistencia-tecnica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia-tecnica.html',
  styleUrls: ['./asistencia-tecnica.css']
})
export class AsistenciaTecnicaComponent {

  asistencia: IAsistenciaTecnica = {
    nombreInstitucion: '',
    tipoAsistencia: '',
    especialistas: '',
    regionOperacion: '',
    requisitosServicio: '',
    capacidadAtencion: '',
    costos: '',
    documentosInstitucionales: null,

    nombreSolicitante: '',
    tipoSolicitante: '', // Aquí mantienes la inicialización con la cadena vacía, pero TypeScript ya sabe que acepta strings
    tipoSolicitanteOtro: '',
    problemaEspecifico: '',
    ubicacion: ''
  };

  // Propiedad para controlar la visibilidad del campo de texto
  mostrarCampoOtroTipo: boolean = false;

  tiposSolicitante: string[] = [
    'Productor',
    'Empresa',
    'Cooperativa',
    'Municipio',
    'Otro' // Opción 'Otro' añadida a la lista
  ];

  // Función para manejar el cambio en el combobox
  manejarCambioTipoSolicitante(): void {
    // La comparación ahora es válida
    this.mostrarCampoOtroTipo = this.asistencia.tipoSolicitante === 'Otro';

    if (!this.mostrarCampoOtroTipo) {
      this.asistencia.tipoSolicitanteOtro = '';
    }
  }

  seleccionarArchivo(event: any) {
    this.asistencia.documentosInstitucionales = event.target.files[0];
  }

  guardar(): void {
    // La comparación ahora es válida
    const tipoFinal = this.asistencia.tipoSolicitante === 'Otro'
      ? `Otro: ${this.asistencia.tipoSolicitanteOtro}`
      : this.asistencia.tipoSolicitante;

    console.log('Tipo de Solicitante (Dato final):', tipoFinal);
    console.log('Datos de Asistencia Técnica:', this.asistencia);
    alert('Datos del MÓDULO ASISTENCIA TÉCNICA listos para enviar.');
  }
}