import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlipbookService } from './flipbook.service';

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private progressSubject = new BehaviorSubject<number>(0);
    public loading$ = this.loadingSubject.asObservable();
    public loadProgress$ = this.progressSubject.asObservable();

    constructor (private flipbookService: FlipbookService) {}

    show(): void {
        this.loadingSubject.next(true);
    }

    hide(): void {
        this.loadingSubject.next(false);
        this.progressSubject.next(0);
    }

    setLoading(isLoading: boolean): void {
        this.loadingSubject.next(isLoading);
        if (!isLoading) {
            this.progressSubject.next(0);
        }
    }

    setProgress(progress: number): void {
        const clamped = Math.min(Math.max(progress, 0), 100);
        this.progressSubject.next(clamped);
        if (clamped >= 100) {
            this.flipbookService.markFlipbookReady();
            setTimeout(() => {
                this.hide();
            }, 500);
        }
    }
}
