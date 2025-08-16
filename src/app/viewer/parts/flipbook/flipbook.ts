import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { FlipbookService } from '../../../services/flipbook.service';
import { LoaderService } from '../../../services/loader.service';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { PanZoomService } from '../../../services/pan-zoom.service';
import { getDistance, getMidpoint } from '../../../utils/touch.utils';

@Component({
  selector: 'app-flipbook',
  imports: [CommonModule],
  templateUrl: './flipbook.html',
  styleUrl: './flipbook.scss'
})
export class Flipbook {
  @ViewChild('flipbook', { static: true }) flipbookRef!: ElementRef;

  @Input() buttomBar = false;

  wrapperContainerStyle = {
    width: 0,
    height: 0,
    left: 0,
    top: 0
  }

  isLandscape = true;
  flipbookDimentionsRatio = 1;
  currentPage = 1;
  animateFirstLastPage = true;
  private resizeTimeout: any;
  private imageSizeReady = false;
  private domReady = false;
  private imageLoadReady = false;


  pages: string[] = [];
  allPages: string[] = [];
  imagesLoaded = 0;

  @HostListener('window:resize')
  onResize() {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    this.setWrapperContainerSize();
    this.resizeFlipbook();
  }

  constructor(private flipbookService: FlipbookService, private loaderService: LoaderService, private panZoomService: PanZoomService) {
  }

  isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  private lastTapTime = 0;
  private pinchDetected = false;
private doubleTapTimeout: any;

  ngOnInit() {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    this.allPages = this.flipbookService.getPages();


    // this.flipbookRef.nativeElement.addEventListener('wheel', (event: WheelEvent) => {

    //   // if (event.ctrlKey) { // esto detecta un pinch en trackpad
    //   //   event.preventDefault();
    //   //   this.panZoomService.getInstance()?.zoomWithWheel(event)
    //   // }
    //   console.log("entro")
    //   this.panZoomService.createPanzoom();
    //     setTimeout(() => {
    //       this.panZoomService.getInstance()?.zoomWithWheel(event);
    //     }, 1);
    // }, { passive: false });

    this.flipbookService.getImageSizeAsync().then((size: { width: number; height: number }) => {
      this.flipbookDimentionsRatio = size.height / size.width;

      this.setWrapperContainerSize();

      this.imageSizeReady = true;
      this.tryInitFlipbook();

      this.loadPagesSequentially(0);
    });
  }

  private initialicePanZoom() {

    this.panZoomService.setTarget(this.flipbookRef.nativeElement);

    if (this.isMobile) { //Mobile

      let initialDistance: number | null = null;

      this.flipbookRef.nativeElement.addEventListener('touchstart', (event: TouchEvent) => {
        //#region DoubleTap
        const currentTime = new Date().getTime();
        const tapDeltaTime = currentTime - this.lastTapTime;

        if (tapDeltaTime < 200 && tapDeltaTime > 0) {
          event.preventDefault();

          this.pinchDetected = false; // reiniciamos bandera
          console.log("detecting pinch....");

          clearTimeout(this.doubleTapTimeout);
          this.doubleTapTimeout = setTimeout(() => {
            if (!this.pinchDetected) {
              console.log("doubleTap");
              const panzoomEnabled = this.panZoomService.isEnabled();
              const touch = event.touches[0] || event.changedTouches[0];
              if (!panzoomEnabled) {
                this.panZoomService.zoomToPoint(2, {
                  clientX: touch.clientX,
                  clientY: touch.clientY
                });
              } else {
                this.panZoomService.resetZoom();
              }
            }
          }, 1000); // Delay para ver si se activa pinch
        }

        this.lastTapTime = currentTime;
        //#endregion

        //#region Pinch
        if (event.touches.length === 2) {
          initialDistance = getDistance(event.touches);
        }
        //#endregion

      }, { passive: false });

      this.flipbookRef.nativeElement.addEventListener('touchmove', (event: TouchEvent) => {
        //#region Pinch
        if (event.touches.length === 2 && initialDistance !== null ) {
          const currentDistance = getDistance(event.touches);

          // Detecta si realmente se está intentando hacer pinch
          const pinchThreshold = 10;
          if (Math.abs(currentDistance - initialDistance) > pinchThreshold) {
            console.log("pinching");
            this.pinchDetected = true;

            if (currentDistance > initialDistance) { //zoom in

              if(!this.panZoomService.isEnabled()) {
                const midpoint = getMidpoint(event.touches);
                this.panZoomService.zoomToPoint(2, { clientX: midpoint.clientX, clientY: midpoint.clientY });
              }

            } else { //zoom out

            }

            initialDistance = null; // Evitar que dispare muchas veces
          }
        }
        //#endregion
      }, { passive: false });

    } else { //Desktop

      this.flipbookRef.nativeElement.addEventListener('dblclick', (event: MouseEvent) => {
        console.log("double click");
        const panzoomEnabled = this.panZoomService.isEnabled();
        if (!panzoomEnabled) {
          this.panZoomService.zoomToPoint(2, { clientX: event.clientX, clientY: event.clientY });
        } else {
          this.panZoomService.resetZoom();
        }
      });

    }


  }

  loadPagesSequentially(index: number) {
    if (index >= this.allPages.length) {
      this.imageLoadReady = true;
      this.tryInitFlipbook();
      return; // todas cargadas
    }

    const img = new Image();
    img.src = this.allPages[index];

    img.onload = () => {
      // Agrega la URL para que Angular cree el <img> en el DOM
      this.pages.push(this.allPages[index]);

      // Actualiza progreso
      this.imagesLoaded++;
      const totalPages = this.flipbookService.getTotalPages();
      this.loaderService.setProgress(Math.floor((this.imagesLoaded / totalPages) * 100));

      // Espera 100ms y carga siguiente
      setTimeout(() => {
        this.loadPagesSequentially(index + 1);
      }, 50);
    };

  }

  ngAfterViewInit() {
    this.flipbookService.setFlipbookElement(this.flipbookRef.nativeElement);
    this.initialicePanZoom();
    this.domReady = true;
    this.tryInitFlipbook();
  }

  private tryInitFlipbook() {
    if (this.domReady && this.imageSizeReady && this.imageLoadReady) {
      this.initFlipbook();
    }
  }

  private getFlibookSize(): { pageWidth: number, pageHeight: number, flipbookWidth: number } {
    const availableHeight = window.innerHeight - (this.buttomBar ? (70.4 + 0.02 * window.innerHeight) : 0);

    let flipbookWidth = window.innerWidth * 0.95;
    let pageWidth = this.isLandscape ? flipbookWidth / 2 : flipbookWidth;
    let pageHeight = pageWidth * this.flipbookDimentionsRatio;

    if (pageHeight >= availableHeight * 0.90) {
      pageHeight = availableHeight * 0.85;
      flipbookWidth = (pageHeight / this.flipbookDimentionsRatio) * 2;
      pageWidth = this.isLandscape ? flipbookWidth / 2 : flipbookWidth;
    }

    return { pageWidth, pageHeight, flipbookWidth };
  }

  private setWrapperContainerSize() {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();
    this.wrapperContainerStyle.width = flipbookWidth;
    this.wrapperContainerStyle.height = pageHeight;
    const lessHeightButtomBar = this.buttomBar ? (70.4 + 0.02 * window.innerHeight) : 0;
    this.wrapperContainerStyle.top = (window.innerHeight - pageHeight - lessHeightButtomBar) / 2;
    this.wrapperContainerStyle.left = (window.innerWidth - flipbookWidth) / 2;
  }

  private initFlipbook() {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();
    const display = this.isLandscape ? 'double' : 'single';

    this.flipbookService.$flipbook.turn({
      width: flipbookWidth,
      height: pageHeight,
      display: display,
      page: 1,
      autoCenter: true,
      duration: 900,
      gradients: true,
      inclination: 0
    });


    this.flipbookService.$flipbook.bind('start', () => {
      const display = this.flipbookService.$flipbook.turn('display');
      if (display === 'single') {
        this.flipbookService.$flipbook.find('.page, .turn-page').css('background-color', 'white');
      }
    });

    this.flipbookService.$flipbook.bind('turning', (e: any, page: number) => {
      this.currentPage = page;
    });
  }

  resizeFlipbook() {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();

    // Desactiva la animación
    this.animateFirstLastPage = false;

    const currentDisplay = this.flipbookService.$flipbook.turn('display');
    const newDisplay = this.isLandscape ? 'double' : 'single';
    if (currentDisplay != newDisplay) {
      this.flipbookService.$flipbook.turn('display', newDisplay);
    }

    this.flipbookService.$flipbook.turn('size', flipbookWidth, pageHeight);

    // Limpia el timeout anterior si existía
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Espera 1 segundo desde el último resize antes de reactivar la animación
    this.resizeTimeout = setTimeout(() => {
      this.animateFirstLastPage = true;
      this.flipbookService.$flipbook.turn('resize');
    }, 500);
  }

  onImageLoad() {
    const totalPages = this.flipbookService.getTotalPages();
    this.imagesLoaded++;
    this.loaderService.setProgress(Math.floor((this.imagesLoaded / totalPages) * 100));
  }




}
