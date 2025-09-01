import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class FlipbookService {
  private imageSize: { width: number; height: number } | null = null;
  private loadPromise: Promise<{ width: number; height: number }>;

  private flipbookImageData = {
    basePath: 'assets/flipbook',
    baseName: 'Portafolio Francesca Borja',
    type: 'webp'
  };
  private totalPages = 18;

  $flipbook!: any;

  private flipbookReadySubject = new BehaviorSubject<boolean>(false);
  private disabled = false;

  flipbookReady$ = this.flipbookReadySubject.asObservable();

  getPDFRelativePath(): string {
    return `assets/pdfs/${this.flipbookImageData.baseName}.pdf`;
  }

  getPDF(): string{
    return `${this.flipbookImageData.baseName}.pdf`;
  }

  disable(): void {
    this.disabled = true;
    this.$flipbook.turn('disable', true);
  }

  enable(): void {
    this.disabled = false;
    this.$flipbook.turn('disable', false);
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  setFlipbookElement(el: HTMLElement) {
    this.$flipbook = $(el);
  }

  markFlipbookReady() {
    // Si necesitas setear el estado en otro momento manualmente
    this.flipbookReadySubject.next(true);
  } 

  constructor() {
    this.loadPromise = this.loadImageSize(); // empieza a cargar apenas se construye
  }

  private loadImageSize(): Promise<{ width: number; height: number }> {
    if (this.imageSize) {
      return Promise.resolve(this.imageSize);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = `${this.flipbookImageData.basePath}/low/${this.flipbookImageData.baseName}-1.${this.flipbookImageData.type}`;
      img.onload = () => {
        this.imageSize = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        resolve(this.imageSize);
      };
    });
  }

  getImageSizeAsync(): Promise<{ width: number; height: number }> {
    return this.loadPromise;
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getPageImage(page: number, quality: 'low' | 'high' = 'high'): string {
    return `${this.flipbookImageData.basePath}/${quality}/${this.flipbookImageData.baseName}-${page}.${this.flipbookImageData.type}`;
  }

  getPages(quality: 'low' | 'high' = 'high'): string[] {
    return Array.from(
      { length: this.totalPages },
      (_, i) => `${this.flipbookImageData.basePath}/${quality}/${this.flipbookImageData.baseName}-${i + 1}.${this.flipbookImageData.type}`
    );
  }
  


}
