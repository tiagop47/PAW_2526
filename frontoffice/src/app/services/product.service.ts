import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProductDTO, ProductComparacaoDTO } from '../models/product.dto';
import { API_URL, formatImageUrl } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${API_URL}/products`;

  constructor(private http: HttpClient) {}

  getProducts(supermarketId?: string): Observable<ProductDTO[]> {
    const url = supermarketId ? `${this.apiUrl}?supermercado=${supermarketId}` : this.apiUrl;

    return this.http.get<ProductDTO[]>(url).pipe(map((products) => products.map((p) => this.formatProduct(p))));
  }

  getProduct(id: string): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.apiUrl}/${id}`).pipe(map((product) => this.formatProduct(product)));
  }

  private formatProduct(product: ProductDTO): ProductDTO {
    product.imagem = formatImageUrl(product.imagem);
    return product;
  }

  compararPorNome(nome: string): Observable<ProductComparacaoDTO[]> {
    return this.http.get<ProductComparacaoDTO[]>(`${this.apiUrl}?nome=${encodeURIComponent(nome)}`);
  }
}
