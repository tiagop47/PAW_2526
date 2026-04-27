import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrderResponseDTO, OrdersResponseDTO } from '../models/order.dto';
import { Order } from '../models/order';
import { API_URL } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private endpoint = `${API_URL}/orders`;

  constructor(private http: HttpClient) {}

  criarEncomenda(dados: {
    supermercadoId: string;
    produtos: { produtoId: string; quantidade: number }[];
    metodoEntrega: string;
    moradaEntrega?: string;
    codigoCupao?: string;
    coordenadasEntrega?: { lat: number; lng: number };
  }): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(this.endpoint, dados)
      .pipe(map((res) => new Order(res.encomenda)));
  }

  validarCupao(codigo: string, supermercadoId: string): Observable<{ sucesso: boolean; percentagemDesconto: number; cupaoId: string }> {
    return this.http.post<{ sucesso: boolean; percentagemDesconto: number; cupaoId: string }>(`${this.endpoint}/validar-cupao`, {
      codigo,
      supermercadoId
    });
  }

  listarEncomendas(): Observable<Order[]> {
    return this.http
      .get<OrdersResponseDTO>(this.endpoint)
      .pipe(map((res) => res.encomendas.map((dto) => new Order(dto))));
  }

  obterEncomenda(id: string): Observable<Order> {
    return this.http
      .get<OrderResponseDTO>(`${this.endpoint}/${id}`)
      .pipe(map((res) => new Order(res.encomenda)));
  }

  cancelarEncomenda(id: string): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(`${this.endpoint}/${id}/cancelar`, {})
      .pipe(map((res) => new Order(res.encomenda)));
  }

  confirmarRececao(id: string): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(`${this.endpoint}/${id}/confirmar-rececao`, {})
      .pipe(map((res) => new Order(res.encomenda)));
  }
}
