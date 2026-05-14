import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../app.config';
import { CouponDTO } from '../models/coupon.dto';

export interface UserStats {
  totalEncomendas: number;
  fidelidade: {
    totalGasto: number;
    patamar: number;
    valorCupao: number;
    cupoesGanhos: number;
    progressoAtual: number;
    faltam: number;
    percentagem: number;
  };
  produtosMaisComprados: {
    _id: string;
    nome: string;
    imagem: string;
    totalQuantidade: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class UserStatsService {
  private baseUrl = `${API_URL}/users`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ sucesso: boolean; stats: UserStats }> {
    return this.http.get<{ sucesso: boolean; stats: UserStats }>(`${this.baseUrl}/stats`);
  }

  getCupoes(): Observable<{ sucesso: boolean; cupoes: CouponDTO[] }> {
    return this.http.get<{ sucesso: boolean; cupoes: CouponDTO[] }>(`${this.baseUrl}/cupoes`);
  }
}
