import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupermarketDTO } from '../models/supermarket.dto';
import { API_URL } from '../app.config';
import { CategoryDTO } from '../models/category.dto';
import { HomePromotionsDTO } from '../models/home-promotions.dto';

@Injectable({
  providedIn: 'root',
})
export class SupermarketService {
  private apiUrl = `${API_URL}/supermercados`;

  selectedSupermarketId = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getSupermarkets(): Observable<SupermarketDTO[]> {
    return this.http.get<SupermarketDTO[]>(this.apiUrl);
  }

  getCategorias(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.apiUrl}/categorias`);
  }

  getPromocoes(): Observable<HomePromotionsDTO> {
    return this.http.get<HomePromotionsDTO>(`${this.apiUrl}/promocoes`);
  }

  getSupermarket(id: string): Observable<SupermarketDTO> {
    return this.http.get<SupermarketDTO>(`${this.apiUrl}/${id}`);
  }

  getMetodosCusto(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/metodoPreco`);
  }

  getCupoes(
    supermercadoId: string,
  ): Observable<{ nome: string; cupoes: any[] }> {
    return this.http.get<{ nome: string; cupoes: any[] }>(`${this.apiUrl}/${supermercadoId}/cupoes`);
  }

  selectSupermarket(id: string) {
    this.selectedSupermarketId.set(id);
  }
}
