import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-home',
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  pdfSrc = 'assets/pdfs/portafolio-op.pdf';
  loading = true;
  loadProgress = 0;
  loadingStart = Date.now();

  onProgress(progressData: any) {
    if (progressData?.total) {
      this.loadProgress = Math.round((progressData.loaded / progressData.total) * 100);
    }
  }

  onPdfLoadComplete() {
    const minLoadingTime = 1500;
    const elapsed = Date.now() - this.loadingStart;
    const wait = Math.max(minLoadingTime - elapsed, 0);

    setTimeout(() => {
      this.loading = false;
    }, wait);
  }

}
