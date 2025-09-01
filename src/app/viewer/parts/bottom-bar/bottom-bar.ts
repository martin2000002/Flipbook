import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DownloadIcon, Maximize2Icon, Minimize2Icon, LucideAngularModule, PlusIcon, MinusIcon } from 'lucide-angular';
import { FlipbookService } from '../../../services/flipbook.service';
import { Subscription, filter, take } from 'rxjs';
import { PanZoomService } from '../../../services/pan-zoom.service';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ElementMetricsService } from '../../../services/element-metrics.service';

@Component({
  selector: 'app-bottom-bar',
  imports: [CommonModule, FormsModule, LucideAngularModule, IconButton],
  templateUrl: './bottom-bar.html',
  styleUrl: './bottom-bar.scss',
})
export class BottomBar {
  @ViewChild('pageSlider', { static: true }) pageSliderRef!: ElementRef<HTMLInputElement>;
  @ViewChild('buttomBar') buttomBarRef!: ElementRef<HTMLDivElement>;

  isFullscreen = false;
  isDragging = false;
  showPreview = false;
  previewImages: string[] = [];
  previewLabel = '';
  pagesText = '';
  isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  currentPageSlider = 1;
  sliderStep = 1;
  totalPages = 0;
  zoom = 0;
  previewImageStyle = {
    width: 0,
    height: 0
  };

  previewContainerStyle = {
    left: 0,
    top: 0
  };

  isFirefox = false;

  readonly icons = {
    maximize: Maximize2Icon,
    minimize: Minimize2Icon,
    download: DownloadIcon,
    plus: PlusIcon,
    minus: MinusIcon
  };

  get pageTextWidth(): string {
    const maxDigits = this.totalPages.toString().length;
    const totalCharacters = maxDigits * 3 + 6; // a - b / c → a = maxDigits, b = maxDigits, c = maxDigits, 6 símbolos(' - ', ' / ')
    const corrected = totalCharacters * 0.8;
    return `${Math.round(corrected)}ch`;
  }

  private isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);
  private animatingSlider = false;
  private lastTurnedByArrows = 0;
  private pageSettedWithSlider = false;
  private sub = new Subscription();

  private get currentPage(): number {
    return Math.round(this.currentPageSlider);
  }

  constructor(
    private flipbookService: FlipbookService,
    private panZoomService: PanZoomService,
    private elementMetricsService: ElementMetricsService
  ) { }

  @HostListener('window:resize')
  onResize() {
    this.setPreviewImageSize();
    this.setPageInfo();
  }

  ngOnInit(): void {

    this.isFirefox = typeof (window as any).InstallTrigger !== 'undefined';
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);

    this.sub.add(
      this.flipbookService.flipbookReady$
        .pipe(filter(ready => ready), take(1))
        .subscribe(() => {
          this.flipbookReady();
        })
    );

    this.sub.add(
      this.panZoomService.scale$.subscribe(scale => {
        this.zoom = scale - 1;
      })
    );
  }

  ngAfterViewInit(): void {
    const rect = this.buttomBarRef.nativeElement.getBoundingClientRect();
    this.elementMetricsService.setMetrics('buttomBar', rect);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
  }

  private fullscreenChangeHandler = () => {
    this.isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );
  };

  private flipbookReady(): void {
    this.totalPages = this.flipbookService.getTotalPages();
    this.pagesText = `1 / ${this.totalPages}`;
    this.setPreviewImageSize();

    this.flipbookService.$flipbook.bind('turned', (e: any, page: number, view: any) => {
      if (!this.pageSettedWithSlider && !this.isDragging) {
        this.currentPageSlider = page;
        this.setPageInfo();

      } else {
        this.pageSettedWithSlider = false;
      }
    });
  }

  private setPreviewImageSize(): void {

    this.flipbookService.getImageSizeAsync().then((size: { width: number; height: number }) => {
      const screenWidth = window.innerWidth;
      const dimentionsRatio = size.height / size.width;

      let width = 0;
      let height = 0;

      if (screenWidth >= 1280) {
        // xl
        width = 100;
      } else if (screenWidth >= 1024) {
        //lg
        width = 95;
      } else if (screenWidth >= 768) {
        //md
        width = 90;
      } else if (screenWidth >= 640) {
        //sm
        width = 85;
      } else {
        //dafault
        width = 80;
      }

      height = dimentionsRatio * width;
      this.previewImageStyle = { width, height };
    });
  }

  private setPreviewContainerPosition() {
    const buttomBarRect = this.buttomBarRef.nativeElement.getBoundingClientRect();
    const buttomBar = this.buttomBarRef.nativeElement;

    //left
    const pageSlider = this.pageSliderRef?.nativeElement;

    const min = Number(pageSlider.min);
    const max = Number(pageSlider.max);
    const val = this.currentPageSlider;

    const pageSliderRect = pageSlider.getBoundingClientRect();
    const percent = (val - min) / (max - min);
    const thumbX = percent * pageSliderRect.width;
    const thumbWidthPx = getComputedStyle(document.documentElement).getPropertyValue('--slider-pages-thumb-width');
    const thumbWidthNumber = parseFloat(thumbWidthPx);
    const sliderAdjustment = (-2 * thumbWidthNumber * percent + thumbWidthNumber) / 2;

    const screenWidth = window.innerWidth;
    const gapWidth = this.previewImages.length === 1 ? 0 : 4;
    const previewContainerWidth = this.previewImageStyle.width * this.previewImages.length + 16 + gapWidth; //16 -> padding
    const widthScreen_ButtomBar = (screenWidth - buttomBar.offsetWidth) / 2
    const widthButtomBar_PageSlider = (buttomBar.offsetWidth - pageSliderRect.width) / 2;
    const left = widthScreen_ButtomBar + widthButtomBar_PageSlider - previewContainerWidth / 2 + thumbX + sliderAdjustment;

    //top
    const previewContainerHeight = this.previewImageStyle.height + 31.99; //31.99 -> text height + text padding + container padding
    const top = buttomBarRect.top - previewContainerHeight - 8;

    this.previewContainerStyle = { left, top };
  }

  private setPageInfo(): void {
    const display = this.flipbookService.$flipbook.turn('display');

    if (display == 'double') {
      if (this.currentPage == 1 || this.currentPage == this.totalPages) {
        this.pagesText = `${this.currentPage} / ${this.totalPages}`;
      } else {
        const { page1, page2 } = this.getPageGroup();
        this.pagesText = `${page1} - ${page2} / ${this.totalPages}`;
      }
    } else {
      this.pagesText = `${this.currentPage} / ${this.totalPages}`;
    }
  }

  private getPageGroup(): { page1: number, page2: number } {
    const groupIndex = (this.currentPage - (this.currentPage % 2)) / 2 + 1;
    const page1 = 2 * (groupIndex - 1);
    const page2 = page1 + 1;
    return { page1, page2 };
  }

  zoomOut(): void {
    this.panZoomService.zoomToCenterPage(this.zoom, this.currentPage, true);
  }
  zoomIn(): void {
    this.panZoomService.zoomToCenterPage(this.zoom + 2, this.currentPage, true);
  }

  onSliderChange(): void {
    this.panZoomService.zoomToCenterPage(this.zoom + 1, this.currentPage);
  }

  downloadPDF(): void {
    const pdfRelativePath = this.flipbookService.getPDFRelativePath();
    const pdf = this.flipbookService.getPDF();

    if (this.isIOS) {
      // En iOS abrir en otra pestaña
      window.open(pdfRelativePath, '_blank');
    } else {
      // Forzar descarga en otros dispositivos
      fetch(pdfRelativePath)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = pdf;
          link.click();
          window.URL.revokeObjectURL(url);
        });
    }
  }

  toggleFullscreen(): void {
    if (!this.isIOS) {
      if (this.isFullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen();
      }
    }
  }

  private enterFullscreen(): void {
    const elem = document.documentElement; // Toda la página
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  onSliderTouchStartPage(event: TouchEvent, slider: HTMLInputElement): void {
    function valueInStep(value: number): number {
      return Math.round(value / +slider.step) * +slider.step;
    }

    const touch = event.touches[0];
    const rect = slider.getBoundingClientRect();
    const percent = (touch.clientX - rect.left) / rect.width;
    const value = (+slider.min) + percent * (+slider.max - +slider.min);

    // Colocar el thumb donde tocó
    slider.value = String(valueInStep(value));
    this.currentPageSlider = +slider.value;
    this.onSliderStart();

    // Escuchar movimiento
    const moveHandler = (e: TouchEvent) => {
      if (!this.isDragging) return;
      const t = e.touches[0];
      const p = (t.clientX - rect.left) / rect.width;
      const v = (+slider.min) + p * (+slider.max - +slider.min);
      slider.value = String(valueInStep(v));
      this.currentPageSlider = +slider.value;
      this.updatePreview();
    };

    const endHandler = () => {
      this.onSliderEnd();
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', endHandler);
      window.removeEventListener('touchcancel', endHandler);
    };

    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', endHandler);
    window.addEventListener('touchcancel', endHandler);
  }

  updatePreview() {
    const display = this.flipbookService.$flipbook.turn('display');
    const isSmall = (display === 'single') || (this.currentPage === 1) || (this.currentPage === this.totalPages);

    if (isSmall) {
      this.previewImages = [this.flipbookService.getPageImage(this.currentPage, 'low')];
      this.previewLabel = `${this.currentPage}`;
    } else {
      const { page1, page2 } = this.getPageGroup();

      this.previewImages = [
        this.flipbookService.getPageImage(page1, 'low'),
        this.flipbookService.getPageImage(page2, 'low'),
      ];
      this.previewLabel = `${page1}-${page2}`;
    }
    this.setPreviewContainerPosition();
  }

  onSliderTouchStartZoom(event: TouchEvent, slider: HTMLInputElement): void {
    const touch = event.touches[0];
    const rect = slider.getBoundingClientRect();
    const percent = (touch.clientX - rect.left) / rect.width;
    const value = (+slider.min) + percent * (+slider.max - +slider.min);

    // Colocar el thumb donde tocó
    this.zoom = Math.round(value / +slider.step) * +slider.step;

    // Escuchar movimiento
    const moveHandler = (e: TouchEvent) => {
      const t = e.touches[0];
      const p = (t.clientX - rect.left) / rect.width;
      const v = (+slider.min) + p * (+slider.max - +slider.min);
      this.zoom = Math.round(v / +slider.step) * +slider.step;
      this.onSliderChange();
    };

    const endHandler = () => {
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', endHandler);
      window.removeEventListener('touchcancel', endHandler);
    };

    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', endHandler);
    window.addEventListener('touchcancel', endHandler);
  }

  onSliderStart(): void {
    this.sliderStep = 0.001;
    this.isDragging = true;
    this.showPreview = true;
    this.updatePreview();
  }

  onSliderMove(): void {
    if (this.isDragging) {
      this.updatePreview();
    }
  }

  onSliderEnd(): void {
    this.sliderStep = 1;
    this.pageSettedWithSlider = true;
    this.currentPageSlider = this.currentPage;
    this.setPreviewContainerPosition();
    this.isDragging = false;
    setTimeout(() => {
      this.showPreview = false;
    }, 300);
    this.ensureTurnPage();
    this.setPageInfo();
  }

  private ensureTurnPage() {
    const disabled = this.flipbookService.isDisabled();
    if (disabled) {
      this.flipbookService.enable();
    }

    this.flipbookService.$flipbook.turn('page', this.currentPage);

    if (disabled) {
      this.flipbookService.disable();
    }
  }

  onSliderValueChange(newValue: number): void {
    const { page1, page2 } = this.getPageGroup();

    if (!this.isDragging && !this.animatingSlider && (this.lastTurnedByArrows != page1 && this.lastTurnedByArrows != page2)) {
      this.ensureTurnPage();
      this.setPageInfo();
      this.lastTurnedByArrows = newValue;
    }
  }
}