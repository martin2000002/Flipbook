import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ElementMetrics {
  id: string;
  height: number;
  width: number;
  top: number;
  left: number;
}

@Injectable({ providedIn: 'root' })
export class ElementMetricsService {
  private metricsSubject = new BehaviorSubject<ElementMetrics | null>(null);
  metrics$ = this.metricsSubject.asObservable();

  setMetrics(id: string, rect: DOMRect) {
    this.metricsSubject.next({
      id,
      height: rect.height,
      width: rect.width,
      top: rect.top,
      left: rect.left
    });
  }
}
