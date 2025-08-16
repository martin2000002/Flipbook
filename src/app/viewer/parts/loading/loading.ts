import { Component } from '@angular/core';
import { LoaderService } from '../../../services/loader.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LottiePlayer } from '../../../core/lottie-player/lottie-player';

@Component({
  selector: 'app-loading',
  imports: [CommonModule, LottiePlayer],
  templateUrl: './loading.html',
  styleUrl: './loading.scss'
})
export class Loading {

  loading$: Observable<boolean>;
  progress$!: Observable<number>;
  lottieReady = false;

  lottieOptions = {
    path: 'assets/gifs/Cosmos.json', // animación exportada de After Effects
    loop: true,
    autoplay: true,
  };

  constructor (private loaderService: LoaderService) {
    this.loading$ = this.loaderService.loading$;
    this.progress$ = this.loaderService.loadProgress$;
  }

  onLottieReady() {
    this.lottieReady = true;
  }

}
