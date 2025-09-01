import { Injectable, ElementRef } from '@angular/core';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { FlipbookService } from './flipbook.service';
import { BehaviorSubject } from 'rxjs';
import { clamp } from '../utils/math.utils';

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

    private sigmoideStepScaleActive = false;
    private readonly defaultStep = 0.3;
    private targetElementDimensions!: DOMRect;

    private scaleSubject = new BehaviorSubject<number>(1);
    public scale$ = this.scaleSubject.asObservable();

    constructor(private flipbookService: FlipbookService) { }

    setTarget(element: HTMLElement | ElementRef<HTMLElement>): void {
        if (!element) {
            throw new Error('PanZoomService: El elemento proporcionado es inválido.');
        }
        this.targetElement = element instanceof ElementRef ? element.nativeElement : element;
    }

    createPanzoom(): void {
        this.flipbookService.disable();

        this.forceStop = false;
        this.scaleData = {
            deltaScale: 0,
            lastScale: 0
        }

        this.assertTargetSet();

        if (this.panzoomInstance) return;

        this.targetElementDimensions = this.targetElement!.getBoundingClientRect();

        this.panzoomInstance = Panzoom(this.targetElement!, {
            maxScale: 10,
            minScale: 1,
            contain: 'outside',
            cursor: 'grab',
            overflow: 'visible',
            step: this.defaultStep
        });

        this.panzoomEnabled = true;
        this.targetElement!.style.touchAction = 'none';

        this.targetElement!.addEventListener(
            'panzoomchange',
            (e: any) => {
                // e.detail contiene { scale, x, y, isDragging }



                const scale = e.detail.scale;

                if (scale === this.scaleData.lastScale) {
                    return;
                }

                if (this.sigmoideStepScaleActive) {
                    this.sigmoideStepScale(scale);
                }

                this.scaleData.deltaScale = scale - this.scaleData.lastScale;

                const scaleMarginError = 0.1;
                if ((scale >= 1 - scaleMarginError && scale <= 1 + scaleMarginError) && this.scaleData.deltaScale < 0 && !this.forceStop) {
                    // Si vuelve al zoom 1, destruir panzoom
                    this.forceStop = true;
                    this.destroyPanzoom();

                }

                this.scaleData.lastScale = scale;

                this.scaleSubject.next(scale);

            }
        );
    }

    destroyPanzoom(): void {
        this.assertTargetSet();
        this.assertInstanceSet();

        this.disableSigmoideStepScale();

        this.resetZoom(true);

        this.panzoomInstance?.destroy();
        this.panzoomInstance = null;
        this.panzoomEnabled = false;

        this.targetElement!.style.touchAction = 'auto';
        this.targetElement!.style.cursor = 'default';
        setTimeout(() => {
            this.targetElement!.style.transition = 'margin-left 0.7s ease-in-out';
        }, 100);
       
        if (this.targetElement!.parentElement) {
            this.targetElement!.parentElement.style.overflow = 'visible';
        }

        this.flipbookService.enable();
    }

    enableSigmoideStepScale(): void {
        this.sigmoideStepScaleActive = true;
    }

    disableSigmoideStepScale(): void {
        this.sigmoideStepScaleActive = false;
        this.panzoomInstance?.setOptions({ step: this.defaultStep });
    }

    sigmoideStepScale(scale: number): void {
        const newStep = 3.3 / (1 + Math.pow(Math.E, -0.4 * (scale - 4)));
        this.panzoomInstance?.setOptions({ step: newStep });
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

    zoomToCenterPage(scale: number, page: number, animate: boolean = false): void {
        const clampedScale = clamp(scale, 1, 10);

        this.assertTargetSet;

        if (!this.panzoomInstance) {
            this.createPanzoom();
            setTimeout(() => {
                this.zoomCenter(clampedScale, page, animate);
            }, 1);
        } else {
            this.zoomCenter(clampedScale, page, animate);
        }


        this.scaleSubject.next(clampedScale); // notificamos el nuevo valor cuando venga del slider
    }

    private zoomCenter(scale: number, page: number, animate: boolean = false): void {
        const rect = this.targetElement!.getBoundingClientRect();
        const display = this.flipbookService.$flipbook.turn('display');
        if (display === 'single') {
            this.getOrCreateInstance().zoom(scale, { focal: { x: 0, y: 0 }, animate: animate });
        } else {
            const side = (page % 2 === 0) ? -1 : 1;

            this.getOrCreateInstance().zoom(scale, { focal: { x: side * rect.width / 3.3333, y: 0 }, animate: animate });
        }
    }

    resetZoom(skipAsserts: boolean = false): void {
        if (!skipAsserts) {
            this.assertTargetSet();
            this.assertInstanceSet();
        }

        this.panzoomInstance?.reset();
    }

    zoomWithWheel(event: WheelEvent): void {
        if (event.deltaY < 0) { // zoom in
            this.getOrCreateInstance().zoomWithWheel(event);

        } else { // zoom out

            if (this.panzoomInstance) {
                this.panzoomInstance.zoomWithWheel(event);
            }

        }

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
