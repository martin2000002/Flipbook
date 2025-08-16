import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import lottie from 'lottie-web';


@Component({
  selector: 'app-lottie-player',
  imports: [],
  templateUrl: './lottie-player.html',
  styleUrl: './lottie-player.scss'
})
export class LottiePlayer {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() path!: string;
  @Input() loop: boolean = true;
  @Input() autoplay: boolean = true;
  @Output() animationReady = new EventEmitter<void>();

  animation: any;

  ngOnInit() {
    this.animation = lottie.loadAnimation({
      container: this.container.nativeElement,
      renderer: 'svg',
      loop: this.loop,
      autoplay: this.autoplay,
      path: this.path,
    });

    this.animation.addEventListener('DOMLoaded', () => {
      this.animationReady.emit();
    });
  }

  ngOnDestroy() {
    this.animation?.destroy();
  }
}
