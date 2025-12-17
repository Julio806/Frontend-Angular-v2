import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ===================================
// INTERFAZ ACTUALIZADA
// Se añade el campo de especificación para 'tipo'
// ===================================
export interface ITransferenciaTecnologica {
  nombreTecnologia: string;
  tipo: string;
  especificacionOtroTipo?: string; // Nuevo campo para la especificación
  descripcion: string;
  capacidades: string;
  servicios: string;
  requisitos: string;
  disponibilidad: string;
  costos: string;
  responsable: string;
  documentos: File | null;
  carta: File | null;
}

@Component({
  selector: 'app-transferencias-tecnologicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferencias-tecnologicas.html',
  styleUrls: ['./transferencias-tecnologicas.css']
})
export class TransferenciasTecnologicasComponent {

  datos: ITransferenciaTecnologica = {
    nombreTecnologia: '',
    tipo: '',
    especificacionOtroTipo: '', // Inicializar el campo de especificación
    descripcion: '',
    capacidades: '',
    servicios: '',
    requisitos: '',
    disponibilidad: '',
    costos: '',
    responsable: '',
    documentos: null,
    carta: null
  };

  tiposTecnologia: string[] = [
    'Laboratorio',
    'Prototipo',
    'Equipo',
    'Software',
    'Método / proceso',
    'Otro' // Añadido
  ];

  // Propiedad calculada para controlar la visibilidad en el HTML
  get mostrarOtroTipo(): boolean {
    return this.datos.tipo === 'Otro';
  }

  seleccionarArchivo(event: Event, tipo: 'documentos' | 'carta'): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];

      if (tipo === 'documentos') {
        this.datos.documentos = archivo;
      } else {
        this.datos.carta = archivo;
      }
    }
  }

  // Lógica para validar y guardar (MODIFICADO para consolidar el valor)
  guardarTransferencias(): void {
    const datosAEnviar: ITransferenciaTecnologica = { ...this.datos };

    // 1. VALIDACIÓN BÁSICA (Asegurar que el campo de especificación no esté vacío si se seleccionó "Otro")
    if (this.mostrarOtroTipo && !datosAEnviar.especificacionOtroTipo?.trim()) {
      alert('Por favor, especifique el tipo de tecnología "Otro".');
      return;
    }

    // 2. CONSOLIDACIÓN: Si se seleccionó "Otro", usamos la especificación como valor final.
    if (this.mostrarOtroTipo && datosAEnviar.especificacionOtroTipo) {
      datosAEnviar.tipo = datosAEnviar.especificacionOtroTipo;
    }

    // Opcional: Eliminar el campo auxiliar de la versión final (depende de cómo se envíen los datos al backend)
    delete datosAEnviar.especificacionOtroTipo;

    console.log('=== DATOS DE TRANSFERENCIA TECNOLÓGICA CONSOLIDADOS ===');
    console.log(datosAEnviar);
    console.log('===================================================');
    alert("Datos del módulo TRANSFERENCIAS TECNOLÓGICAS listos para enviar.");
  }
}