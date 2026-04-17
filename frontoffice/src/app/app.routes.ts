import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'products/:supermarketId', component: ProductListComponent }, // ID na URL
  { path: 'product/:id', component: ProductDetailComponent },
  { path: '**', redirectTo: '' }
];
