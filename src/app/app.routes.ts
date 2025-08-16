import { Routes } from '@angular/router';
import { Home } from './DEPRECATED/home/home';
import { Flipbook } from './DEPRECATED/flipbook/flipbook';
import { FlipbookV2 } from './DEPRECATED/flipbook-v2/flipbook-v2';
import { FlipbookV3 } from './DEPRECATED/flipbook-v3/flipbook-v3';
import { Viewer } from './viewer/viewer';
import { Prueba } from './DEPRECATED/prueba/prueba';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'jsjs', component: Viewer },
    { path: '**', redirectTo: '' }
];
