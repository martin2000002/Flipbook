import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

declare var $: any;

@Component({
  selector: 'app-flipbook-v2',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './flipbook-v2.html',
  styleUrl: './flipbook-v2.scss'
})
export class FlipbookV2 {
  @ViewChild('flipbook', { static: true }) flipbookRef!: ElementRef;
  $flipbook!: any;
  flipbookMarginLeft = -this.getFlibookSize().pageWidth;

  pdfSrc = 'assets/pdfs/portafolio-op.pdf';
  totalPages = 10;
  loadedPages = 0;
  aspectRatio = 3509 / 2480; // ≈ 1.414
  pages: number[] = Array.
    from({ length: this.totalPages });
  currentPage: number = 1;
  blockLeftCorner = true;
  animationInProgress = false;
  animateFlipbook=true;

  onPdfLoadComplete() {
    this.loadedPages++;
    if (this.loadedPages === this.totalPages) {
      this.initFlipbook();
    }
  }

  getFlibookSize(): { pageWidth: number, pageHeight: number, flipbookWidth: number } {
    const flipbookWidth = window.innerWidth * 0.95;
    const pageWidth = flipbookWidth / 2;
    const pageHeight = pageWidth / this.aspectRatio;

    return { pageWidth, pageHeight, flipbookWidth };
  }

  @HostListener('window:resize')
  onResize() {
    if (this.loadedPages === this.totalPages) {
      this.resizeFlipbook();
    }
  }

  private resizeTimeout: any;

  resizeFlipbook(view?: 'single' | 'double') {
    console.log("resizing", view);
    const { pageWidth, pageHeight, flipbookWidth } = this.getFlibookSize();
    let viewUsed = view;
    if (!view) {
      viewUsed = this.$flipbook.turn('display');
    }
    const usedWidth = viewUsed == 'single' ? pageWidth : flipbookWidth;
  
    // Desactiva la animación
    this.animateFlipbook = false;
  
    if (!view) {
      this.$flipbook.turn('size', usedWidth, pageHeight);
    } else {
      setTimeout(() => {
        this.$flipbook.turn('size', usedWidth, pageHeight);
        this.$flipbook.turn('display', view);
      }, 0);
    }
  
    this.$flipbook.turn('resize');
  
    if (this.flipbookMarginLeft < 0) {
      this.flipbookMarginLeft = -pageWidth;
    } else if (this.flipbookMarginLeft > 0) {
      this.flipbookMarginLeft = pageWidth;
    }
  
    // Limpia el timeout anterior si existía
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  
    // Espera 1 segundo desde el último resize antes de reactivar la animación
    this.resizeTimeout = setTimeout(() => {
      this.animateFlipbook = true;
      console.log("Animación reactivada");
    }, 1000);
  }
  


  initFlipbook() {
    const { flipbookWidth, pageWidth, pageHeight } = this.getFlibookSize();

    console.log('flipbookWidth:',flipbookWidth,', pageWidth:',pageWidth,', pageHeight', pageHeight)

    $('#flipbook').turn({
      width: flipbookWidth,
      height: pageHeight,
      display: 'double',
      page: 1,
      autoCenter: false,
      duration: 1000,
      elevation: 10,
      gradients: true
    });

    this.$flipbook = $(this.flipbookRef.nativeElement);


    // $('#flipbook').bind('turning', (e: any, page: number, view: any) => {
    //   console.log("turning", page);
    //   if(page == 1){
    //     this.resizeFlipbook('single');
    //   }
    //   if(page == 2){
    //     this.resizeFlipbook('double');
    //   }

    // });



    $('#flipbook').bind('turning', (e: any, page: number) => {
      this.currentPage = page;
      console.log(page, this.$flipbook.turn('pages'))
      const pages = this.$flipbook.turn('pages');
      if(page === 1 || page === pages) {
        const { pageWidth } = this.getFlibookSize();
        if (page === 1) {
          this.flipbookMarginLeft = -pageWidth;
        } else {
          this.flipbookMarginLeft = pageWidth;
        }
      } else {
        this.flipbookMarginLeft = 0;
      }

    });




    // $('#flipbook').bind('end', () => {
    //   this.animationInProgress = false;
    //   console.log("end");

    // });


  }




  prev() {

    $('#flipbook').turn('previous');

  }

  next() {
    $('#flipbook').turn('next');


  }
}
