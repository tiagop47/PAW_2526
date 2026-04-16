import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supermarket } from '../models/supermarket.model';

@Injectable({
  providedIn: 'root',
})
export class SupermarketService {
  private apiUrl = 'http://localhost:3000/api/supermercados';

  selectedSupermarketId = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getSupermarkets(): Observable<Supermarket[]> {
    return this.http.get<Supermarket[]>(this.apiUrl);
  }

  selectSupermarket(id: string) {
    this.selectedSupermarketId.set(id);
  }
}
