import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { FlipbookService } from '../../../services/flipbook.service';
import { LoaderService } from '../../../services/loader.service';
import { PanZoomService } from '../../../services/pan-zoom.service';
import { getDistance, getMidpoint } from '../../../utils/touch.utils';
import { combineLatest, filter, from, map } from 'rxjs';
import { ElementMetricsService } from '../../../services/element-metrics.service';

@Component({
  selector: 'app-flipbook',
  imports: [CommonModule],
  templateUrl: './flipbook.html',
  styleUrl: './flipbook.scss'
})
export class Flipbook {
  @ViewChild('flipbook', { static: true }) flipbookRef!: ElementRef;

  wrapperContainerStyle = {
    width: 0,
    height: 0,
    left: 0,
    top: 0
  }

  flipbookDimentionsRatio = 1;
  pages: string[] = [];

  private isLandscape = true;
  private buttomBarHeight = 0;

  private resizeTimeout: any;
  private imageSizeReady = false;
  private domReady = false;
  private imageLoadReady = false;

  private imagesLoaded = 0;

  private isIOSSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  private isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  private lastTapTime = 0;
  private pinchDetected = false;
  private doubleTapTimeout: any;

  constructor(
    private flipbookService: FlipbookService,
    private loaderService: LoaderService,
    private panZoomService: PanZoomService,
    private elementMetricsService: ElementMetricsService
  ) { }

  @HostListener('window:resize')
  onResize(): void {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    this.setWrapperContainerSize();
    this.resizeFlipbook();

    if (this.isIOSSafari) {
      setTimeout(() => { //Fix resize for Safari groups
        this.setWrapperContainerSize();
        this.resizeFlipbook();
      }, 50);
    }
  }

  ngOnInit(): void {
    this.isLandscape = window.innerWidth >= window.innerHeight;
    this.pages = this.flipbookService.getPages();

    const imageSize$ = from(this.flipbookService.getImageSizeAsync());

    const buttomBarHeight$ = this.elementMetricsService.metrics$.pipe(
      filter(metrics => metrics?.id === 'buttomBar'),
      map(metrics => metrics!.height)
    );

    combineLatest([imageSize$, buttomBarHeight$]).subscribe(
      ([size, buttomBarHeight]) => {
        this.buttomBarHeight = buttomBarHeight;
        this.flipbookDimentionsRatio = size.height / size.width;

        this.setWrapperContainerSize();
        this.imageSizeReady = true;
        this.tryInitFlipbook();
      }
    );
  }

  ngAfterViewInit(): void {
    this.flipbookService.setFlipbookElement(this.flipbookRef.nativeElement);
    this.initialicePanZoom();
    this.domReady = true;
    this.tryInitFlipbook();
  }

  private setWrapperContainerSize(): void {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();
    this.wrapperContainerStyle.width = flipbookWidth;
    this.wrapperContainerStyle.height = pageHeight;
    const offsetVh = getComputedStyle(document.documentElement).getPropertyValue('--bottom-bar-offset');
    const offsetDecimal = parseFloat(offsetVh) / 100;
    const lessHeightButtomBar = this.buttomBarHeight + offsetDecimal * window.innerHeight;
    this.wrapperContainerStyle.top = (window.innerHeight - pageHeight - lessHeightButtomBar) / 2;
    this.wrapperContainerStyle.left = (window.innerWidth - flipbookWidth) / 2;
  }

  private getFlibookSize(): { pageWidth: number, pageHeight: number, flipbookWidth: number } {
    const offsetVh = getComputedStyle(document.documentElement).getPropertyValue('--bottom-bar-offset');
    const offsetDecimal = parseFloat(offsetVh) / 100;
    const availableHeight = window.innerHeight - (this.buttomBarHeight + offsetDecimal * window.innerHeight);

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

  private tryInitFlipbook(): void {
    if (this.domReady && this.imageSizeReady && this.imageLoadReady) {
      this.initFlipbook();
    }
  }

  private initFlipbook(): void {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();
    const display = this.isLandscape ? 'double' : 'single';

    this.flipbookService.$flipbook.turn({
      width: flipbookWidth,
      height: pageHeight,
      display: display,
      page: 1,
      autoCenter: true,
      duration: 900,
      gradients: true
    });

    this.flipbookService.$flipbook.bind('start', () => {
      const display = this.flipbookService.$flipbook.turn('display');
      if (display === 'single') {
        this.flipbookService.$flipbook.find('.page, .turn-page').css('background-color', 'white');
      }
    });
  }

  private initialicePanZoom(): void {

    this.panZoomService.setTarget(this.flipbookRef.nativeElement);

    if (!this.isMobile) { // Desktop

      //#region DoubleClick
      this.flipbookRef.nativeElement.addEventListener('dblclick', (event: MouseEvent) => {

        const panzoomEnabled = this.panZoomService.isEnabled();
        if (!panzoomEnabled) {
          this.panZoomService.zoomToPoint(2, { clientX: event.clientX, clientY: event.clientY });
        } else {
          this.panZoomService.resetZoom();
        }
      });
      //#endregion

      this.flipbookRef.nativeElement.addEventListener('wheel', (event: WheelEvent) => {
        event.preventDefault();

        if (event.ctrlKey) { // Pinch en trackpad
          this.panZoomService.disableSigmoideStepScale();
          this.panZoomService.zoomWithWheel(event);
        }

      }, { passive: false });

    }

    let initialDistance: number | null = null;

    this.flipbookRef.nativeElement.addEventListener('touchstart', (event: TouchEvent) => {
      //#region DoubleTap
      const currentTime = new Date().getTime();
      const tapDeltaTime = currentTime - this.lastTapTime;

      if (tapDeltaTime < 200 && tapDeltaTime > 0) {
        event.preventDefault();

        this.pinchDetected = false;

        clearTimeout(this.doubleTapTimeout);
        this.doubleTapTimeout = setTimeout(() => {
          if (!this.pinchDetected) {
            const panzoomEnabled = this.panZoomService.isEnabled();
            const touch = event.touches[0] || event.changedTouches[0];
            if (!panzoomEnabled) {
              this.panZoomService.zoomToPoint(2, { clientX: touch.clientX, clientY: touch.clientY });
            } else {
              this.panZoomService.resetZoom();
            }
          }
        }, 300); // Delay para ver si se activa pinch
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
      if (event.touches.length === 2 && initialDistance !== null) {
        const currentDistance = getDistance(event.touches);

        // Detecta si realmente se está intentando hacer pinch
        const pinchThreshold = 10;
        if (Math.abs(currentDistance - initialDistance) > pinchThreshold) {
          this.pinchDetected = true;
          this.panZoomService.enableSigmoideStepScale();

          if (currentDistance > initialDistance) { //zoom in

            if (!this.panZoomService.isEnabled()) {
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

  }

  private resizeFlipbook(): void {
    const { flipbookWidth, pageHeight } = this.getFlibookSize();

    const currentDisplay = this.flipbookService.$flipbook.turn('display');
    const newDisplay = this.isLandscape ? 'double' : 'single';
    if (currentDisplay != newDisplay) {
      this.flipbookService.$flipbook.turn('display', newDisplay);
    }

    this.flipbookService.$flipbook.turn('size', flipbookWidth, pageHeight);

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.flipbookService.$flipbook.turn('resize');
    }, 500);
  }

  onImageLoad(): void {
    const totalPages = this.flipbookService.getTotalPages();
    this.imagesLoaded++;
    const progress = Math.floor((this.imagesLoaded / totalPages) * 100);

    this.loaderService.setProgress(progress);

    if (progress === 100) {
      this.imageLoadReady = true;
      this.tryInitFlipbook();
    }
  }

}
