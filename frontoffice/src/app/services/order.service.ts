import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrderDTO } from '../models/order.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  criarEncomenda(dados: {
    supermercadoId: string;
    produtos: { produtoId: string; quantidade: number }[];
    metodoEntrega: string;
    moradaEntrega?: string;
    coordenadasEntrega?: { lat: number; lng: number };
  }): Observable<OrderDTO> {
    return this.http.post<{ sucesso: boolean; encomenda: OrderDTO }>(this.apiUrl, dados).pipe(
      map(res => res.encomenda)
    );
  }

  listarEncomendas(): Observable<OrderDTO[]> {
    return this.http.get<{ sucesso: boolean; encomendas: OrderDTO[] }>(this.apiUrl).pipe(
      map(res => res.encomendas)
    );
  }

  obterEncomenda(id: string): Observable<OrderDTO> {
    return this.http.get<{ sucesso: boolean; encomenda: OrderDTO }>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.encomenda)
    );
  }

  cancelarEncomenda(id: string): Observable<OrderDTO> {
    return this.http.post<{ sucesso: boolean; encomenda: OrderDTO }>(`${this.apiUrl}/${id}/cancelar`, {}).pipe(
      map(res => res.encomenda)
    );
  }

  confirmarRececao(id: string): Observable<OrderDTO> {
    return this.http.post<{ sucesso: boolean; encomenda: OrderDTO }>(`${this.apiUrl}/${id}/confirmar-rececao`, {}).pipe(
      map(res => res.encomenda)
    );
  }
}
