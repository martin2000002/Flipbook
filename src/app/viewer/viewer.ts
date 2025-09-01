import { Component } from '@angular/core';
import { Loading } from "./parts/loading/loading";
import { Flipbook } from "./parts/flipbook/flipbook";
import { BottomBar } from "./parts/bottom-bar/bottom-bar";
import { LoaderService } from '../services/loader.service';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-viewer',
  imports: [Loading, Flipbook, BottomBar, CommonModule],
  templateUrl: './viewer.html',
  styleUrl: './viewer.scss'
})
export class Viewer {
  isMobile = true;
  bottomBarVisible = false;

  constructor(private loaderService: LoaderService, private title: Title, private meta: Meta) {
    this.loaderService.show();

    this.title.setTitle('Portafolio Francesca Borja');

    this.meta.addTags([
      { name: 'description', content: 'Portafolio interactivo con información de mis proyectos de la carrera de Diseño de Interiores | Francesca Borja Aguirre' },
      { name: 'keywords', content: 'flipbook, portafolio, proyectos, USFQ, Diseño de Interiores, Francesca Borja, Universidad San Francisco de Quito' },
      { property: 'og:title', content: 'Portafolio Francesca Borja' },
      { property: 'og:description', content: 'Portafolio interactivo con información de mis proyectos de Diseño de Interiores' },
    ]);
  }

}
