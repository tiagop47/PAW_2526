import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupermarketDTO } from '../models/supermarket.dto';
import { API_URL } from '../app.config';

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

  getSupermarket(id: string): Observable<SupermarketDTO> {
    return this.http.get<SupermarketDTO>(`${this.apiUrl}/${id}`);
  }

  selectSupermarket(id: string) {
    this.selectedSupermarketId.set(id);
  }
}
