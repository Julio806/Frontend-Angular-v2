// MapasR.ts (COMPLETO Y FINAL - INCLUYE FIX DE ASYNC IMPORT Y DE ASSETS DE ICONOS)

import {
    Component,
    OnInit,
    AfterViewInit,
    Inject,
    PLATFORM_ID,
    ChangeDetectorRef,
    NgZone
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import * as GeoJSON from 'geojson';

// --- DEFINICIÓN DE INTERFACES (Se mantienen) ---

interface IRegionalData {
    nombreRegion: string;
    codigoRegion: string;
    actoresIdentificados: number;
    proveedoresServicios: number;
    totalProductores: number;
    altitudPromedio: number;
    variedadesPredominantes: string[];
    produccionEstimada: 'Baja' | 'Media' | 'Alta';
    productoresPorTamano: { small: number; medium: number; large: number };
    rangoAltitudinal: string;
}

interface IRegionFeature extends GeoJSON.Feature<GeoJSON.Polygon, IRegionalData> { }

interface IActor {
    id: string;
    tipoActor: string;
    nombre: string;
    localizacion: {
        region: string;
        municipio: string;
        localidad: string;
        coordenadas: [number, number];
    };
}


// --- VARIABLES GLOBALES DE LEAFLET ---
let L: any = null; 
let markerClusterGroup: any = null; 


// --- COMPONENTE ANGULAR ---

@Component({
    selector: 'app-mapas-regionales',
    standalone: true,
    imports: [FormsModule, CommonModule, HttpClientModule],
    templateUrl: './MapasR.html',
    styleUrls: ['./MapasR.css']
})
export class MapaR implements OnInit, AfterViewInit {

    // --- PROPIEDADES PRIVADAS DE LEAFLET ---
    private map: any;
    private geoJsonLayer: any = null;
    private markersLayer: any;

    // --- PROPIEDADES PÚBLICAS DE ESTADO (Usadas en el template) ---
    isLoading: boolean = false; 
    isPanelOpen: boolean = false;
    selectedRegionData: IRegionalData | null = null;

    // --- DATOS Y MODELOS PARA FILTROS ---
    eslabones = ['Producción', 'Beneficiado', 'Tostado', 'Comercialización'];
    certificaciones = ['Orgánico', 'Café de especialidad', 'Comercio justo', 'Rainforest', 'Denominación de origen'];
    tecnologicos = ['ITFC', 'TecNM Tuxtla', 'TecNM Tapachula', 'Otro'];

    filterEslabones: { [key: string]: boolean } = {};
    filterCertificaciones: { [key: string]: boolean } = {};
    selectedTec: string = '';

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) {
        this.eslabones.forEach(e => this.filterEslabones[e] = false);
        this.certificaciones.forEach(c => this.filterCertificaciones[c] = false);
    }

    ngOnInit(): void { }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.initLeafletAsync(); 
        } else {
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    // --- LÓGICA DE INICIALIZACIÓN DE LIBRERÍAS DE NAVEGADOR (SSR FIX + ICON FIX) ---
    
    private async initLeafletAsync(): Promise<void> {
        
        if (!L) {
            try {
                // 1. Carga Asíncrona de Leaflet (SSR FIX)
                const leafletModule = await import('leaflet');
                L = leafletModule.default || leafletModule;
                
                // Carga dinámica del plugin MarkerCluster
                await import('leaflet.markercluster');
                
                // 2. Configuración de Leaflet y Assets (DYNAMIC REQUIRE FIX)
                
                markerClusterGroup = L.markerClusterGroup;
                
                // 🛑 FIX: Eliminar el require dinámico de imágenes
                // Usamos L.Icon.Default.imagePath y rutas de assets.
                
                L.Icon.Default.imagePath = 'assets/images/'; // Establece la ruta base

                L.Icon.Default.mergeOptions({
                    // Apuntamos directamente a la ruta donde angular.json copia los archivos
                    iconRetinaUrl: 'assets/images/marker-icon-2x.png',
                    iconUrl: 'assets/images/marker-icon.png',
                    shadowUrl: 'assets/images/marker-shadow.png'
                });

            } catch (e) {
                console.error("Error al cargar Leaflet asíncronamente:", e);
                // Si la carga falla, no seguimos
                return; 
            }
        }
        
        // 3. Inicializar la capa de marcadores del componente
        if (!this.markersLayer && markerClusterGroup) {
             this.markersLayer = markerClusterGroup();
        }
        
        // 4. Llamar a la lógica principal del mapa
        this.initMap(); 
    }


    // --- LÓGICA DEL MAPA (Se mantiene) ---

    private initMap(): void {
        if (!L || !document.getElementById('map-container')) {
             console.error("Fallo de inicialización: El contenedor del mapa no existe o Leaflet (L) no está cargado.");
             return; 
        }

        this.map = L.map('map-container').setView([16.5, -92.5], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        if (this.markersLayer) {
            this.map.addLayer(this.markersLayer);
        }

        this.loadRegionalBorders();

        if (this.map) {
            this.map.invalidateSize();
        }
    }

    public loadRegionalBorders(): void {
        if (!L || !this.map) return;

        const simulatedGeoJson = this.getSimulatedGeoJson();

        if (this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
        }

        this.geoJsonLayer = L.geoJSON(simulatedGeoJson as GeoJSON.FeatureCollection, {
            style: (feature: GeoJSON.Feature) => this.getRegionStyle(feature as IRegionFeature),
            onEachFeature: (feature: GeoJSON.Feature, layer: any) => {
                this.onLayerInteraction(layer, feature as IRegionFeature);
            }
        }).addTo(this.map);

        try {
            this.map.fitBounds(this.geoJsonLayer.getBounds());
        } catch (e) {
            console.warn("Fallo al calcular los límites de GeoJSON. Usando vista por defecto.");
            this.map.setView([16.5, -92.5], 8);
        }

        this.loadMarkers();
    }

    public getRegionStyle(feature: IRegionFeature): any {
        if (!L || !feature.properties) return {};

        const { produccionEstimada } = feature.properties;
        let color;

        switch (produccionEstimada) {
            case 'Alta': color = '#006400'; break;
            case 'Media': color = '#B8860B'; break;
            case 'Baja': color = '#8B4513'; break;
            default: color = '#A9A9A9';
        }
        return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.6
        };
    }

    public onLayerInteraction(layer: any, feature: IRegionFeature): void {
        if (!L || !feature.properties) return;

        const props = feature.properties;

        layer.on('mouseover', (e: any) => {
            const tooltipContent = `<b>${props.nombreRegion}</b><br>Actores: ${props.actoresIdentificados}<br>Altitud Promedio: ${props.altitudPromedio} msnm`;
            layer.bindTooltip(tooltipContent, { permanent: true, direction: 'auto', opacity: 0.9 }).openTooltip(e.latlng);
            layer.setStyle({ weight: 4, color: '#FFD700', fillOpacity: 0.8 });
        });

        layer.on('mouseout', () => {
            if (this.geoJsonLayer) this.geoJsonLayer.resetStyle(layer);
            layer.unbindTooltip();
        });

        layer.on('click', () => {
            this.ngZone.run(() => {
                this.map.fitBounds(layer.getBounds());
                this.selectedRegionData = props;
                this.isPanelOpen = true;
                this.loadMarkers(props.codigoRegion);
            });
        });
    }

    public loadMarkers(regionCode?: string, filters?: any): void {
        if (!L || !this.markersLayer) return;

        this.markersLayer.clearLayers();
        const actors = this.getSimulatedActors();
        let filteredActors = actors;

        if (regionCode) {
            filteredActors = filteredActors.filter(a => a.localizacion.region === regionCode);
        }

        const markers: any[] = [];
        filteredActors.forEach(actor => {
            const [lat, lng] = actor.localizacion.coordenadas;
            const marker = L.marker([lat, lng]);

            marker.bindPopup(`<b>${actor.nombre}</b><br>Tipo: ${actor.tipoActor}`);
            markers.push(marker);
        });
        this.markersLayer.addLayers(markers);
    }

    // --- MÉTODOS DE INTERACCIÓN DE LA VISTA (Para el HTML) ---

    public applyFilters(): void {
        const filters = {
            eslabones: Object.keys(this.filterEslabones).filter(key => this.filterEslabones[key]),
            certificaciones: Object.keys(this.filterCertificaciones).filter(key => this.filterCertificaciones[key]),
            tecnologico: this.selectedTec
        };
        console.log('Filtros aplicados:', filters);
        this.loadMarkers(undefined, filters);
    }

    public generateReport(): void {
        if (this.selectedRegionData) {
            alert(`Generando Reporte PDF para: ${this.selectedRegionData.nombreRegion}`);
        }
    }

    public closeInfoPanel(): void {
        this.isPanelOpen = false;
        this.selectedRegionData = null;
    }

    // --- MOCK DATA ---
    public getSimulatedGeoJson(): GeoJSON.FeatureCollection<GeoJSON.Polygon, IRegionalData> {
        // MOCK data de polígonos GeoJSON
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "nombreRegion": "Soconusco",
                        "codigoRegion": "SOC",
                        "actoresIdentificados": 120,
                        "proveedoresServicios": 15,
                        "totalProductores": 85,
                        "altitudPromedio": 1450,
                        "variedadesPredominantes": ["Typica", "Bourbon", "Caturra"],
                        "produccionEstimada": "Alta",
                        "productoresPorTamano": { small: 50, medium: 30, large: 5 },
                        "rangoAltitudinal": "800 – 1700 msnm"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[-92.5, 15.0], [-92.0, 15.0], [-92.0, 15.5], [-92.5, 15.5], [-92.5, 15.0]]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {
                        "nombreRegion": "Sierra Mariscal",
                        "codigoRegion": "SIE",
                        "actoresIdentificados": 75,
                        "proveedoresServicios": 8,
                        "totalProductores": 60,
                        "altitudPromedio": 1600,
                        "variedadesPredominantes": ["Catuaí", "Geisha", "Costa Rica 95"],
                        "produccionEstimada": "Media",
                        "productoresPorTamano": { small: 40, medium: 15, large: 5 },
                        "rangoAltitudinal": "1000 – 1900 msnm"
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[-93.0, 15.5], [-92.5, 15.5], [-92.5, 16.0], [-93.0, 16.0], [-93.0, 15.5]]]
                    }
                }
            ]
        };
    }

    public getSimulatedActors(): IActor[] {
        // MOCK data de actores
        return [
            { id: '1', tipoActor: 'Productor', nombre: 'Finca El Triunfo', localizacion: { region: 'SOC', municipio: 'Tapachula', localidad: 'Acapetahua', coordenadas: [15.25, -92.3] } },
            { id: '2', tipoActor: 'Cooperativa', nombre: 'Coop. Altos', localizacion: { region: 'SIE', municipio: 'Motozintla', localidad: 'La Unión', coordenadas: [15.7, -92.7] } },
            { id: '3', tipoActor: 'Tostador', nombre: 'Café Premium', localizacion: { region: 'SOC', municipio: 'Tapachula', localidad: 'Centro', coordenadas: [15.0, -92.0] } },
        ];
    }
}