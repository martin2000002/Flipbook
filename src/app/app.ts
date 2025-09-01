import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('portafolio');

  constructor() {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args: any[]) {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        args[0].includes('NG0913')
      ) {
        // Ignorar el warning de imágenes grandes
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
  }

}
