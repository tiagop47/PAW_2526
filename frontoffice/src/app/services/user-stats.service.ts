import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../app.config';

export interface UserStats {
  totalEncomendas: number;
  produtosMaisComprados: {
    _id: string;
    nome: string;
    imagem: string;
    totalQuantidade: number;
  }[];
}

export interface Cupao {
  _id: string;
  codigo: string;
  percentagemDesconto: number;
  supermercado: string;
  prazo: string;
  ativo: boolean;
  expirado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserStatsService {
  private baseUrl = `${API_URL}/users`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ sucesso: boolean; stats: UserStats }> {
    return this.http.get<{ sucesso: boolean; stats: UserStats }>(`${this.baseUrl}/stats`);
  }

  getCupoes(): Observable<{ sucesso: boolean; cupoes: Cupao[] }> {
    return this.http.get<{ sucesso: boolean; cupoes: Cupao[] }>(`${this.baseUrl}/cupoes`);
  }
}
