import { Routes } from '@angular/router';
import { Home } from './DEPRECATED/home/home';
import { Viewer } from './viewer/viewer';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'jsjs', component: Viewer },
    { path: '**', redirectTo: '' }
];
