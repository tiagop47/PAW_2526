import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) { }

  getProducts(supermarketId?: string): Observable<Product[]> {
    const url = supermarketId ? `${this.apiUrl}?supermercado=${supermarketId}` : this.apiUrl;
    return this.http.get<Product[]>(url);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}
