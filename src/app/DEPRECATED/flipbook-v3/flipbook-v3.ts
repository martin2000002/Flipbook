import { Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import Panzoom from '@panzoom/panzoom';
import type { PanzoomObject } from '@panzoom/panzoom';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileIcon, Maximize2Icon, DownloadIcon } from 'lucide-angular';


declare var $: any;

@Component({
  selector: 'app-flipbook-v3',
  standalone: true,
  imports: [CommonModule, PdfViewerModule, FormsModule, LucideAngularModule],
  templateUrl: './flipbook-v3.html',
  styleUrl: './flipbook-v3.scss'
})
export class FlipbookV3 {
  
  readonly maximizeIcon = Maximize2Icon;
  readonly downloadIcon = DownloadIcon;
  @ViewChild('flipbook', { static: true }) flipbookRef!: ElementRef;
  @ViewChild('pageSlider', { static: true }) sliderRef!: ElementRef<HTMLInputElement>;
  $flipbook!: any;
  flipbookMarginLeft = 0;
  currentPage = 1;
  pages = Array.from({ length: 18 }, (_, i) => `assets/flipbook/portafolio-op-${i + 1}.png`);

  aspectRatio_WidthOverHeight = 3509 / 2480; // ≈ 1.414
  animateOnChangeDisplaysFlipbook = true;
  private resizeTimeout: any;

  loading = true;
  loadProgress = 0;
  private imagesLoaded = 0;
  isLandscape = true;

  panzoomInstance: PanzoomObject | null = null;

  wrapperWidth = 0;  // o lo que necesites
  wrapperHeight = 0;
  wrapperTop = 100;
  wrapperLeft = 200;


  isDragging = false;
  previewImages: string[] = [];
  previewLabel = '';
  
thumbLeft = 0;

get visorPositionClass(): string {
  return 'bottom-[calc(2vh+70.4px+5px)]'
}


onSliderStart() {
  this.isDragging = true;
  this.updatePreview();
}

onSliderMove() {
  if (this.isDragging) {
    this.updatePreview();
  }
}

onSliderEnd() {
  this.isDragging = false;
}

updatePreview() {
  const current = this.currentPage;
  const isSmall = window.innerWidth < 640;

  // Imágenes a mostrar
  if (isSmall) {
    this.previewImages = [`assets/flipbook/portafolio-op-${current}.png`];
    this.previewLabel = `${current}`;
  } else {
    const secondPage = Math.min(current + 1, this.totalPages);
    this.previewImages = [
      `assets/flipbook/portafolio-op-${current}.png`,
      `assets/flipbook/portafolio-op-${secondPage}.png`,
    ];
    this.previewLabel = `${current}-${secondPage}`;
  }

  // Posición del thumb
  this.thumbLeft = this.getSliderThumbX();
}

// Calcula la posición del thumb en px
getSliderThumbX(): number {
  const el = this.sliderRef?.nativeElement;
  if (!el) return 0;

  const min = Number(el.min);
  const max = Number(el.max);
  const val = Number(el.value);

  const sliderRect = el.getBoundingClientRect();
  const percent = (val - min) / (max - min);
  const thumbX = percent * sliderRect.width;

  const width = window.innerWidth;

  return (0.15*width)/2 + 24;

  // Ajuste: resta la mitad del ancho del visor para centrarlo
  const containerRect = el.offsetParent?.getBoundingClientRect();
  return thumbX - 60 + (sliderRect.left - (containerRect?.left || 0));
}

  



  totalPages=18;
  zoom=1

  get pageTextWidth(): string {
    const maxDigits = this.totalPages.toString().length;
    const totalCharacters = maxDigits * 3 + 2; // a-b/c → a = maxDigits, b = maxDigits, c = maxDigits, 2 símbolos
    return `${totalCharacters}ch`;
  }
  
onZoomChange() {
  
}

downloadPDF() {
  // Tu lógica aquí
}

toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}


  ngOnInit() {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    const init = true;
    this.setMarginLeft(init);
    const {flipbookWidth, pageHeight} = this.getFlibookSize();
    this.wrapperHeight = pageHeight;
    this.wrapperWidth = flipbookWidth;
  }


  ngAfterViewInit() {
    this.$flipbook = $(this.flipbookRef.nativeElement);
    this.initFlipbook();
  }

  initFlipbook() {
    const { flipbookWidth, pageWidth, pageHeight } = this.getFlibookSize();

    if (this.isLandscape) {
      this.$flipbook.turn({
        width: flipbookWidth,
        height: pageHeight,
        display: 'double',
        page: 1,
        autoCenter: true,
        duration: 1000,
        elevation: 10,
        gradients: true
      });
    } else {
      this.$flipbook.turn({
        width: pageWidth,
        height: pageHeight,
        display: 'single',
        page: 1,
        autoCenter: false,
        duration: 1000,
        elevation: 10,
        gradients: true
      });
    }

    this.$flipbook.bind('start', () => {
      const display = this.$flipbook.turn('display');
      if (display === 'single') {
        this.$flipbook.find('.page, .turn-page').css('background-color', 'white');
      }
    });

    this.$flipbook.bind('turning', (e: any, page: number) => {
      this.currentPage = page;
      console.log(page, this.$flipbook.turn('pages'))
      this.setMarginLeft();

      // const pages = this.$flipbook.turn('pages');
      // if (this.isLandscape && !(this.currentPage === 1 || this.currentPage === pages)){
      //   const { flipbookWidth } = this.getFlibookSize();
      //   this.wrapperWidth = flipbookWidth;
      // }
    });
  }

  getWrapperPosition(): {top: number, left:number} {
    const top = (window.innerHeight - this.wrapperHeight)/2;
    const left = (window.innerWidth - this.wrapperWidth)/2;
    return { top, left };
  }

  setMarginLeft(init?: boolean) {

    if (init) {
      if (this.isLandscape) {
        const { pageWidth } = this.getFlibookSize();
        this.flipbookMarginLeft = -pageWidth;
      }
      return
    }
    const pages = this.$flipbook.turn('pages');
    if ((this.currentPage === 1 || this.currentPage === pages) && this.isLandscape) {
      const { pageWidth } = this.getFlibookSize();
      if (this.currentPage === 1) {
        this.flipbookMarginLeft = -pageWidth;
      } else {
        this.flipbookMarginLeft = 0.0;
      }
    } else {
      this.flipbookMarginLeft = 0;
    }

  }

  getFlibookSize(): { pageWidth: number, pageHeight: number, flipbookWidth: number } {
    const flipbookWidth = window.innerWidth * 0.95;
    const pageWidth = this.isLandscape ? flipbookWidth / 2 : flipbookWidth;
    const pageHeight = pageWidth / this.aspectRatio_WidthOverHeight;

    return { pageWidth, pageHeight, flipbookWidth };
  }

  @HostListener('window:resize')
  onResize() {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    if (this.isLandscape) {
      this.resizeFlipbook('double');
    } else {
      this.resizeFlipbook('single');
    }
    this.setMarginLeft();
  }

  resizeFlipbook(view?: 'single' | 'double') {
    console.log("resizing", view);
    const { pageWidth, pageHeight, flipbookWidth } = this.getFlibookSize();
    let viewUsed = view;
    if (!view) {
      viewUsed = this.$flipbook.turn('display');
    }
    const usedWidth = viewUsed == 'single' ? pageWidth : flipbookWidth;

    // Desactiva la animación
    this.animateOnChangeDisplaysFlipbook = false;
    this.wrapperWidth = usedWidth;
    this.wrapperHeight = pageHeight;
    if (!view) {
      this.$flipbook.turn('size', usedWidth, pageHeight);
    } else {
      setTimeout(() => {
        this.$flipbook.turn('size', usedWidth, pageHeight);
        this.$flipbook.turn('display', view);
      }, 0);
    }

    this.$flipbook.turn('resize');

    if (this.isLandscape) {
      if (this.flipbookMarginLeft < 0) {
        this.flipbookMarginLeft = -pageWidth;
      } else if (this.flipbookMarginLeft > 0) {
        this.flipbookMarginLeft = 0.0;
      }
    }

    // Limpia el timeout anterior si existía
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Espera 1 segundo desde el último resize antes de reactivar la animación
    this.resizeTimeout = setTimeout(() => {
      this.animateOnChangeDisplaysFlipbook = true;
      console.log("Animación reactivada");
    }, 500);
  }

  prev() {
    this.$flipbook.turn('previous');
  }

  next() {
    this.$flipbook.turn('next');
  }

  onImageLoad() {
    this.imagesLoaded++;
    this.loadProgress = Math.floor((this.imagesLoaded / this.pages.length) * 100);

    if (this.imagesLoaded === this.pages.length) {
      // Todas las imágenes han sido cargadas
      setTimeout(() => {
        this.loading = false;
        //this.initPanzoom();
      }, 1000);

    }
  }

  initPanzoom() {
    const wrapper = this.flipbookRef.nativeElement;

    this.panzoomInstance = Panzoom(wrapper, {
      maxScale: 4,
      minScale: 0.5,
      contain: 'outside',
      startScale: 1,
      canvas: true,
      excludeClass: 'turnjs-element'
    });

    // this.flipbookRef.nativeElement.addEventListener('pan', (event: any) => {
    //   const { x, y } = event.detail;
    //   const { left } = this.getWrapperPosition();
    //   console.log("x: ", x, "y: ",y)
    //   if (x < left) {
    //     this.panzoomInstance?.pan(left, y, { animate: false });
    //   }
    // });
    

    // Habilitar gestos táctiles básicos
    wrapper.addEventListener('wheel', this.panzoomInstance.zoomWithWheel);

    // Corrige el problema de inicio en esquina rara
    // this.panzoomInstance.zoom(1, { animate: false });
    // this.panzoomInstance.pan(0, 0, { animate: false });

    // Maneja gestos manuales para desactivar turn.js al hacer pan/zoom
    wrapper.addEventListener('pointerdown', () => {
      this.$flipbook.turn('disable', true);
    });
    wrapper.addEventListener('pointerup', () => {
      this.$flipbook.turn('disable', false);
    });
  }


  // zoomIn() {
  //   const zoom = this.$flipbook.turn('zoom');
  //   this.$flipbook.turn('zoom', zoom+0.5, 1000);
  // }

  // zoomOut() {
  //   const zoom = this.$flipbook.turn('zoom');
  //   this.$flipbook.turn('zoom', zoom-0.5, 1000);
  // }

  // resetZoom() {
  //   this.$flipbook.turn('zoom', 1, 1000);
  // }

  // isPanEnabled = true;
  // togglePan() {
  //   this.isPanEnabled = !this.isPanEnabled;
  
  //   this.$flipbook.turn('resize');
  // }





  zoomIn() {
    this.panzoomInstance!.zoomIn();
  }

  zoomOut() {
    this.panzoomInstance!.zoomOut();
  }

  resetZoom() {
    this.panzoomInstance!.reset();
  }

  panzoomEnabled = true;
  togglePanzoom() {
    if (!this.panzoomEnabled) {
      // Activar Panzoom
      this.panzoomInstance = Panzoom(this.flipbookRef.nativeElement, {
        maxScale: 10,
        minScale: 1,
        contain: 'outside',
        cursor: 'grab'
      });

      this.flipbookRef.nativeElement.parentElement.style.overflow = 'visible';

      this.flipbookRef.nativeElement.addEventListener('pointerdown', () => console.log('pointerdown fired'));

      this.flipbookRef.nativeElement.addEventListener('dblclick', (event: MouseEvent) => {
        // Obtiene la posición y tamaño del contenedor respecto a la ventana
        const rect = this.flipbookRef.nativeElement.getBoundingClientRect();

        // Coordenadas absolutas del mouse dentro de la ventana
        const mouseX = event.clientX;
        const mouseY = event.clientY;

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

        const scale = this.panzoomInstance?.getScale() ?? 1;
        console.log(scale)

        this.panzoomInstance?.zoomIn({
          animate: true,
          focal: { x: xCenter, y: yCenter }
        });
      });


      // this.flipbookRef.nativeElement.addEventListener('panzoompan', (event: any) => {
      //   const { x, y } = event.detail;
      //   const { left } = this.getWrapperPosition();
      //   console.log("x: ", x, "y: ",y)
      //   if (x < left) {
      //     this.panzoomInstance?.pan(left, y, { animate: false });
      //   }
      // });

      this.flipbookRef.nativeElement.style.touchAction = 'none'; // prevenir scroll del navegador
      this.panzoomEnabled = true;
    } else {
      // Desactivar Panzoom
      this.panzoomInstance?.destroy();
      this.panzoomInstance = null;
      this.panzoomEnabled = false;

      // Restaurar para que turnjs funcione
      this.flipbookRef.nativeElement.style.touchAction = 'auto';
      this.flipbookRef.nativeElement.style.cursor = 'default';
      this.flipbookRef.nativeElement.parentElement.style.overflow = 'visible';

    }
  }
  

}
