import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'products/:supermarketId', component: ProductListComponent }, // ID na URL
  { path: 'product/:id', component: ProductDetailComponent },
  { path: '**', redirectTo: '' }
];
