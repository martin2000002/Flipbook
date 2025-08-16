import { Injectable, ElementRef } from '@angular/core';
import Panzoom, { PanzoomObject, ZoomOptions } from '@panzoom/panzoom';
import { FlipbookService } from './flipbook.service';

@Injectable({
    providedIn: 'root'
})
export class PanZoomService {

    private targetElement: HTMLElement | null = null;
    private panzoomInstance: PanzoomObject | null = null;
    private panzoomEnabled = false;

    private forceStop = false;
    private scaleData = {
        deltaScale: 0,
        lastScale: 0
    }

    setTarget(element: HTMLElement | ElementRef<HTMLElement>): void {
        if (!element) {
            throw new Error('PanZoomService: El elemento proporcionado es inválido.');
        }
        this.targetElement = element instanceof ElementRef ? element.nativeElement : element;
    }

    createPanzoom(): void {
        this.forceStop = false;
        this.scaleData = {
            deltaScale: 0,
            lastScale: 0
        }
        
        this.assertTargetSet();

        if (this.panzoomInstance) return;

        this.panzoomInstance = Panzoom(this.targetElement!, {
            maxScale: 10,
            minScale: 1,
            contain: 'outside',
            cursor: 'grab',
            overflow: 'visible',
            step: 1
        });

        this.panzoomEnabled = true;
        this.targetElement!.style.touchAction = 'none';

        this.targetElement!.addEventListener(
            'panzoomchange',
            (e: any) => {
                // e.detail contiene { scale, x, y, isDragging }
                
                const scale = e.detail.scale;
                const newStep = 3.3 / (1 + Math.pow(Math.E, -0.4*(scale - 4)));
                this.panzoomInstance?.setOptions({step: newStep})

                this.scaleData.deltaScale = scale - this.scaleData.lastScale;
                
                if (scale === 1 && this.scaleData.deltaScale < 0 && scale === 1 && !this.forceStop) {
                    // Si vuelve al zoom 1, destruir panzoom
                    this.forceStop = true;
                    this.destroyPanzoom();
                    
                }

                this.scaleData.lastScale = scale;
                
            }
        );
    }

    destroyPanzoom(): void {
        console.log("destroy")
        this.assertTargetSet();
        this.assertInstanceSet();

        this.resetZoom(true);

        this.panzoomInstance?.destroy();
        this.panzoomInstance = null;
        this.panzoomEnabled = false;

        this.targetElement!.style.touchAction = 'auto';
        this.targetElement!.style.cursor = 'default';
        if (this.targetElement!.parentElement) {
            this.targetElement!.parentElement.style.overflow = 'visible';
        }
    }

    zoomIn(step: number = 0.2): void {
        this.getOrCreateInstance().zoomIn();
    }

    zoomOut(step: number = 0.2): void {
        this.getOrCreateInstance().zoomOut();
    }

    /**
     * Hace zoom hacia un punto específico.
     */
    zoomToPoint(scale: number, point: { clientX: number; clientY: number }): void {
        this.assertTargetSet();
        // Obtiene la posición y tamaño del contenedor respecto a la ventana
        const rect = this.targetElement!.getBoundingClientRect();

        // Coordenadas absolutas del mouse dentro de la ventana
        const mouseX = point.clientX;
        const mouseY = point.clientY;

        // Calcula la posición del clic relativa al contenedor
        const xRelative = mouseX - rect.left;
        const yRelative = mouseY - rect.top;

        function mapToCenterCoords(xRelative: number, yRelative: number, width: number, height: number): { xCenter: number, yCenter: number } {
            const xCenter = 2 * xRelative - width;
            const yCenter = 2 * yRelative - height;
            return { xCenter, yCenter };
        }

        // Zoom relativo al punto donde hiciste doble clic
        const { xCenter, yCenter } = mapToCenterCoords(xRelative, yRelative, rect.width, rect.height);

        // Llamar al servicio para hacer zoom centrado en ese punto
        this.createPanzoom();
        setTimeout(() => {
            this.panzoomInstance!.zoom(scale, { animate: true, focal: { x: xCenter, y: yCenter }, easing: 'ease-in-out', duration: 200 });
        }, 1);
    }

    resetZoom(skipAsserts: boolean = false): void {
        if (!skipAsserts) {
            this.assertTargetSet();
            this.assertInstanceSet();
        }
        
        this.panzoomInstance?.reset();
    }

    getInstance(): PanzoomObject | null {
        return this.panzoomInstance;
    }

    isEnabled(): boolean {
        return this.panzoomEnabled;
    }

    // -------------------------
    // Métodos privados de ayuda
    // -------------------------

    /** Lanza error si no hay elemento definido */
    private assertTargetSet(): void {
        if (!this.targetElement) {
            throw new Error('PanZoomService: No se ha establecido un elemento para Panzoom.');
        }
    }

    /** Lanza error si no hay instancia definida */
    private assertInstanceSet(): void {
        if (!this.panzoomInstance) {
            throw new Error('PanZoomService: No se ha creado una instacia del PanZoom.');
        }
    }

    /** Obtiene la instancia actual o la crea si no existe */
    private getOrCreateInstance(): PanzoomObject {
        this.assertTargetSet();
        if (!this.panzoomInstance) {
            this.createPanzoom();
        }
        return this.panzoomInstance!;
    }
}
