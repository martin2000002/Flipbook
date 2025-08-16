import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-prueba',
  imports: [],
  templateUrl: './prueba.html',
  styleUrl: './prueba.scss'
})
export class Prueba {
  visible = false;

  // Altura desde el fondo en px para mostrar barra
  private readonly threshold = 100;

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const fromBottom = window.innerHeight - event.clientY;
    this.visible = fromBottom <= this.threshold;
  }
}
