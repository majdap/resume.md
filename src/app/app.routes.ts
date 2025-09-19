import { Routes } from '@angular/router';
import { HomePage } from '../pages/home-page/home-page';

export const routes: Routes = [
	{
		path: '',
		component: HomePage,
	},
	{
		path: 'preview',
		loadComponent: () =>
			import('../components/content-display/content-display').then(
				(m) => m.ContentDisplay
			),
	},
	{
		path: '**',
		redirectTo: '/',
	}
];
