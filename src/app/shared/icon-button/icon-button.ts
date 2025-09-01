import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
@Component({
  selector: 'app-icon-button',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss'
})
export class IconButton {
  @Input() icon!: any; // el icono de lucide-angular
  @Input() size = 20;
  @Input() strokeWidth = 2;

  @Output() action = new EventEmitter<void>();

  isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  hovered = false;
  released = false;

  onPress() {
    this.ifMobileLeave();

    this.hovered = true;
    this.released = false;
  }

  onRelease() {
    this.ifMobileLeave();

    this.released = true;
    this.hovered = false;

    setTimeout(() => {
      this.released = false;
    }, 150);
  }

  onClick() {
    if (this.isMobile) {
      setTimeout(() => {

        this.onPress();

        setTimeout(() => {
          this.onRelease();
        }, 200);

      }, 50);

    }

    this.action.emit();
  }

  private ifMobileLeave(): void {
    if (this.isMobile) return;
  }

}
