import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-flipbook',
  imports: [CommonModule],
  templateUrl: './flipbook.html',
  styleUrl: './flipbook.scss'
})
export class Flipbook {
  @ViewChild('flipbook', { static: true }) flipbookEl!: ElementRef<HTMLDivElement>;
  pages = Array.from({ length: 18 }, (_, i) => `assets/flipbook/portafolio-op-${i + 1}.png`);
  readonly aspectRatio = 3509 / 2480; // ≈ 1.414

  ngAfterViewInit() {
    this.setFlipbookSize();
  }



  @HostListener('window:resize')
  onResize() {
    this.setFlipbookSize();
  }

  setFlipbookSize() {
    const maxWidth = window.innerWidth * 0.85;
    console.log("max: " + maxWidth);
    const width = Math.floor(maxWidth);
    console.log("width: " + width);
    const height = Math.floor((width/2) / this.aspectRatio);
    console.log("height: " + height);

      $('#flipbook').turn({
        width: width,
        height: height,
        display: 'double',
        autoCenter: true,
        elevation: 50,
        gradients: true,
        inclination: 0,
        duration:1000
      });
    
  }

  prev() {
    $('#flipbook').turn('previous');
  }

  next() {
    $('#flipbook').turn('next');
    setTimeout(() => {
      $('#flipbook').turn('destroy');
    }, 1000);
  }
}
