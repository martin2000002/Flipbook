import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlipbookService } from './flipbook.service';
import { clamp } from '../utils/math.utils';

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private progressSubject = new BehaviorSubject<number>(0);
    public loading$ = this.loadingSubject.asObservable();
    public loadProgress$ = this.progressSubject.asObservable();

    private readonly config = {
        realMaximumProgress: 75,
        fakeProgressDuration: 1000
    }

    private fakeProgressTimer?: any;

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
        const progressClamped = clamp(progress, 0, 100);
        const progressSealed = (progressClamped * this.config.realMaximumProgress) / 100;

        this.progressSubject.next(Math.round(progressSealed));
        
        if (progressClamped >= 100) {
            this.flipbookService.markFlipbookReady();
            this.completeWithFakeProgress();
        }
    }

    completeWithFakeProgress(): void {
        const target = 100;
        const steps = 30;
        const stepTime = this.config.fakeProgressDuration / steps;
        const increment = (target - this.config.realMaximumProgress) / steps;

        if (this.fakeProgressTimer) {
            clearInterval(this.fakeProgressTimer);
        }

        let currentProgress = this.config.realMaximumProgress;
        this.fakeProgressTimer = setInterval(() => {
            currentProgress += increment;
            if (currentProgress >= target) {
                this.progressSubject.next(100);
                clearInterval(this.fakeProgressTimer);
                this.fakeProgressTimer = undefined;

                //FINALIZO
                setTimeout(
                    () => this.hide()
                , 500);

            } else {
                this.progressSubject.next(Math.round(currentProgress));
            }
        }, stepTime);
    }
}
