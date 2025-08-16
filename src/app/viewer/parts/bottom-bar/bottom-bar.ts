import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DownloadIcon, Maximize2Icon, Minimize2Icon, LucideAngularModule, ThumbsDown } from 'lucide-angular';
import { FlipbookService } from '../../../services/flipbook.service';
import { Subscription, filter, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-bottom-bar',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './bottom-bar.html',
  styleUrl: './bottom-bar.scss',
})
export class BottomBar {
  @ViewChild('pageSlider', { static: true }) pageSliderRef!: ElementRef<HTMLInputElement>;
  @ViewChild('buttomBar') buttomBarRef!: ElementRef<HTMLDivElement>;
  @ViewChild('preview', { static: false }) previewRef!: ElementRef<HTMLDivElement>;

  @Input() visible = false;

  isFullscreen = false;
  isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  isDragging = false;
  previewImages: string[] = [];
  previewLabel = '';
  pagesText = '';
  lastPage = 0;
  animatingSlider = false;
  lastTurnedByArrows = 0;

  thumbLeft = 0;

  currentPageSlider = 1;
  sliderStep = 1;
  totalPages = 0;
  zoom = 0;
  pageSettedWithSlider = false;

  previewImageStyle = {
    width: 0,
    height: 0
  };

  previewContainerStyle = {
    left: 0,
    top: 0
  };

  readonly icons = {
    maximize: Maximize2Icon,
    minimize: Minimize2Icon,
    download: DownloadIcon,
  };

  private sub = new Subscription();

  @HostListener('window:resize')
  onResize() {
    this.setPreviewImageSize();
    this.setPageInfo();
  }

  isExpanded = false; // nuevo: estado de la barra

expandBar() {
  this.isExpanded = true;
}

collapseBar() {
  this.isExpanded = false;
}

// Detectar click fuera
@HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent) {
  if (
    this.isExpanded &&
    this.buttomBarRef &&
    !this.buttomBarRef.nativeElement.contains(event.target as Node)
  ) {
    this.collapseBar();
  }
}


  constructor(private flipbookService: FlipbookService) { }

  ngOnInit() {
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    this.sub.add(
      this.flipbookService.flipbookReady$
        .pipe(filter(ready => ready), take(1))
        .subscribe(() => {
          this.flipbookReady();
        })
    );
  }
  private fullscreenChangeHandler = () => {
    this.isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );
  };

get currentPage(): number {
  return Math.round(this.currentPageSlider);
}

  flipbookReady() {
    this.totalPages = this.flipbookService.getTotalPages();
    this.pagesText = `1 / ${this.totalPages}`;
    this.setPreviewImageSize();

    // this.sub.add(
    //   this.flipbookService.displayMode$.subscribe(display => {
    //     this.setPageInfo(display);
    //   })
    // );

    this.flipbookService.$flipbook.bind('turned', (e: any, page: number, view: any) => {
      const display = this.flipbookService.$flipbook.turn('display');
      // this.lastPage = Math.round(this.currentPage);
      // this.currentPage = page;
      // if (display === 'double') {
      //     this.sliderPage = (page - (page % 2))/2 + 1;
        
      // }
      if (!this.pageSettedWithSlider && !this.isDragging) {
        this.animatingSlider = true;
        this.animateChangeSliderValue(page);
        
      } else {
        this.pageSettedWithSlider = false;
      }
    });
  }

  animateChangeSliderValue(newValue: number, duration: number = 250) {
    this.sliderStep = 0.001;
    const start = performance.now();
    const currentValue = this.currentPage;

    const step = (now: number) => {
      
      let t = now - start;
      let progress = Math.min(t / duration, 1); // entre 0 y 1
  
      // Easing
      let eased = this.easeInOutCubic(progress);
  
      // Nueva posición
      let x = currentValue + (newValue - currentValue) * eased;
  
      // Aquí actualizas tu variable ligada al template
      this.currentPageSlider = x;
  
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        //this.currentPageSlider = this.currentPage;
        this.sliderStep = 1;
        this.setPageInfo();
        this.animatingSlider = false;
      }
    };

    requestAnimationFrame(step);
  }

  easeInOutCubic(p: number): number {
    return p < 0.5
    ? 4 * Math.pow(p, 3)
    : 1 - Math.pow(-2*p + 2, 3)/2; 
  }

  easeInOutQuad(p: number): number {
    return p < 0.5
    ? 2 * p * p 
    : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  setPageInfo() {
    const display = this.flipbookService.$flipbook.turn('display');

    if (display == 'double') {
      //this.sliderMax = (this.totalPages) / 2 + 1;
      if (this.currentPage == 1 || this.currentPage == this.totalPages) {
        this.pagesText = `${this.currentPage} / ${this.totalPages}`;
      } else {
        const {page1, page2} = this.getPageGroup(this.currentPage);
        this.pagesText = `${page1} - ${page2} / ${this.totalPages}`;
      }
    } else {
      this.pagesText = `${this.currentPage} / ${this.totalPages}`;
    }
  }

  private getPageGroup (page: number) : {page1: number, page2: number} {
    const groupIndex = (this.currentPage - (this.currentPage % 2))/2 + 1;
    const page1 = 2*(groupIndex-1);
    const page2 = page1 + 1;
    return {page1, page2};
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);

  }

  private setPreviewImageSize() {

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

      this.setPreviewContainerPosition();
    });
  }

  private setPreviewContainerPosition() {
    const buttomBarRect = this.buttomBarRef.nativeElement.getBoundingClientRect();
    const buttomBar = this.buttomBarRef.nativeElement;

    //left
    const pageSlider = this.pageSliderRef?.nativeElement;

    const min = Number(pageSlider.min);
    const max = Number(pageSlider.max);
    const val = Number(pageSlider.value);

    const pageSliderRect = pageSlider.getBoundingClientRect();
    const percent = (val - min) / (max - min);
    const thumbX = percent * pageSliderRect.width;
    const sliderAdjustment = (-2 * 40 * percent + 40) / 2; //40 -> thumb width

    const screenWidth = window.innerWidth;
    const previewContainerWidth = this.previewImageStyle.width * this.previewImages.length + 20; //20 -> container padding + flex gap

    const widthScreen_ButtomBar = (screenWidth - buttomBar.offsetWidth) / 2
    const widthButtomBar_PageSlider = (buttomBar.offsetWidth - pageSliderRect.width) / 2;

    const left = widthScreen_ButtomBar + widthButtomBar_PageSlider - previewContainerWidth / 2 + thumbX + sliderAdjustment;

    //top
    const previewContainerHeight = this.previewImageStyle.height + 31.99; //31.99 -> text height + text padding + container padding

    const top = buttomBarRect.top - previewContainerHeight - 8;

    this.previewContainerStyle = { left, top };
  }

  get pageTextWidth(): string {
    const maxDigits = this.totalPages.toString().length;
    const totalCharacters = maxDigits * 3 + 6; // a - b / c → a = maxDigits, b = maxDigits, c = maxDigits, 6 símbolos(' - ', ' / ')
    const corrected = totalCharacters *0.75;
    return `${corrected}ch`;
  }

  zoomOut() {
    throw new Error('Method not implemented.');
  }
  zoomIn() {
    throw new Error('Method not implemented.');
  }

  downloadPDF() {
    if (this.isIOS) {
      // En iOS abrir en otra pestaña
      window.open('assets/pdfs/portafolio-op.pdf', '_blank');
    } else {
      // Forzar descarga en otros dispositivos
      fetch('assets/pdfs/portafolio-op.pdf')
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'portafolio-op.pdf';
          link.click();
          window.URL.revokeObjectURL(url);
        });
    }
  }


  toggleFullscreen() {
    if (!this.isIOS) {
      if (this.isFullscreen) {
        this.exitFullscreen();
      } else {
        this.enterFullscreen();
      }
    }
  }

  enterFullscreen() {
    const elem = document.documentElement; // Toda la página
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

onSliderTouchStart(event: TouchEvent, slider: HTMLInputElement) {
  console.log("entro")
  const touch = event.touches[0];
  const rect = slider.getBoundingClientRect();
  const percent = (touch.clientX - rect.left) / rect.width;
  const value = (+slider.min) + percent * (+slider.max - +slider.min);

  // Colocar el thumb donde tocó
  slider.value = String(Math.round(value / +slider.step) * +slider.step);
  //slider.dispatchEvent(new Event('input', { bubbles: true }));

  this.onSliderStart();
  this.isDragging = true;

  // Escuchar movimiento
  const moveHandler = (e: TouchEvent) => {
    if (!this.isDragging) return;
    const t = e.touches[0];
    const p = (t.clientX - rect.left) / rect.width;
    const v = (+slider.min) + p * (+slider.max - +slider.min);
    slider.value = String(Math.round(v / +slider.step) * +slider.step);
    //slider.dispatchEvent(new Event('input', { bubbles: true }));
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


  onSliderStart() {
    this.sliderStep = 0.001;
    this.isDragging = true;
    this.updatePreview();
  }

  onSliderMove() {
    if (this.isDragging) {
      this.updatePreview();
    }
  }

  onSliderEnd() {
    console.log('end')
    this.sliderStep = 1;
    this.pageSettedWithSlider = true;
    
  
    setTimeout(() => {
      this.currentPageSlider = this.currentPage;
      this.isDragging = false;
    }, 10);
    console.log("turning")
    this.flipbookService.$flipbook.turn('page', this.currentPage);
    this.setPageInfo();
    
  }

  updatePreview() {
    const display = this.flipbookService.$flipbook.turn('display');
    const isSmall = (display === 'single') || (this.currentPage === 1) || (this.currentPage === this.totalPages);

    // Imágenes a mostrar
    if (isSmall) {
      //this.previewImages = [`assets/flipbook/low/portafolio-op-${current}.webp`];

      this.previewImages = [this.flipbookService.getPageImage(this.currentPage, 'low')];
      this.previewLabel = `${this.currentPage}`;
    } else {
      const {page1, page2} = this.getPageGroup(this.currentPage);

      this.previewImages = [
        this.flipbookService.getPageImage(page1, 'low'),
        this.flipbookService.getPageImage(page2, 'low'),
      ];
      this.previewLabel = `${page1}-${page2}`;
    }

    this.setPreviewContainerPosition();
  }



  onSliderValueChange(newValue: number) {
    const {page1, page2} = this.getPageGroup(newValue);
    
    if (!this.isDragging && !this.animatingSlider && (this.lastTurnedByArrows != page1 && this.lastTurnedByArrows != page2)) {
      console.log('Nuevo valor:', newValue);
      //this.flipbookService.$flipbook.turn('stop');
      this.flipbookService.$flipbook.turn('page', newValue);
      this.lastTurnedByArrows = newValue;
    }
  }
  

}
