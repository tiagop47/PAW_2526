import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupermarketDTO } from '../models/supermarket.dto';

@Injectable({
  providedIn: 'root',
})
export class SupermarketService {
  private apiUrl = 'http://localhost:3000/api/supermercados';

  selectedSupermarketId = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getSupermarkets(): Observable<SupermarketDTO[]> {
    return this.http.get<SupermarketDTO[]>(this.apiUrl);
  }

  selectSupermarket(id: string) {
    this.selectedSupermarketId.set(id);
  }
}
