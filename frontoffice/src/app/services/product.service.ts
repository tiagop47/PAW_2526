import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductDTO } from '../models/product.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getProducts(supermarketId?: string): Observable<ProductDTO[]> {
    const url = supermarketId ? `${this.apiUrl}?supermercado=${supermarketId}` : this.apiUrl;
    return this.http.get<ProductDTO[]>(url);
  }

  getProduct(id: string): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.apiUrl}/${id}`);
  }
}
