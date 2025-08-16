import { Component, HostListener } from '@angular/core';
import { Loading } from "./parts/loading/loading";
import { Flipbook } from "./parts/flipbook/flipbook";
import { BottomBar } from "./parts/bottom-bar/bottom-bar";
import { LoaderService } from '../services/loader.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FlipbookService } from '../services/flipbook.service';

@Component({
  selector: 'app-viewer',
  imports: [Loading, Flipbook, BottomBar, CommonModule],
  templateUrl: './viewer.html',
  styleUrl: './viewer.scss'
})
export class Viewer {
  isMobile = true;
  //isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  bottomBarVisible = false;

  constructor(private loaderService: LoaderService) {
    this.loaderService.show();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isMobile) {

      this.bottomBarVisible = event.clientY > window.innerHeight - (70.4 + 0.02*window.innerHeight)*1.10;
    }
  }

}
