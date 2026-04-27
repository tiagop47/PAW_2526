import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CartComponent } from './components/cart/cart.component';
import { OrdersComponent } from './components/orders/orders.component';
import { AvaliacoesComponent } from './components/avaliacoes/avaliacoes.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SupermarketsComponent } from './components/supermarkets/supermarkets.component';
import { GuestGuard } from './guards/guest.guard';
import { AuthGuard } from './guards/auth.guard';
import { PaginaMercado } from './pagina-mercado/pagina-mercado';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'supermercados', component: SupermarketsComponent },
  { path: 'supermercado/:id', component: PaginaMercado },
  { path: 'supermercado/:supermarketId', component: PaginaMercado },
  { path: 'products', component: ProductListComponent },
  { path: 'products/:supermarketId', component: ProductListComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },
  { path: 'avaliacoes', component: AvaliacoesComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
