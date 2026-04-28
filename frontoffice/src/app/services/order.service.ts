import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrderDTO, OrderResponseDTO, OrdersResponseDTO } from '../models/order.dto';
import { Order } from '../models/order';
import { API_URL, formatImageUrl } from '../app.config';

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
      .pipe(map((res) => new Order(this.formatOrder(res.encomenda))));
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
      .pipe(map((res) => res.encomendas.map((dto) => new Order(this.formatOrder(dto)))));
  }

  obterEncomenda(id: string): Observable<Order> {
    return this.http
      .get<OrderResponseDTO>(`${this.endpoint}/${id}`)
      .pipe(map((res) => new Order(this.formatOrder(res.encomenda))));
  }

  private formatOrder(o: OrderDTO): OrderDTO {
    if (o.produtos) {
      o.produtos.forEach(item => {
        if (item.produtoId) {
          item.produtoId.imagem = formatImageUrl(item.produtoId.imagem);
        }
      });
    }
    return o;
  }

  cancelarEncomenda(id: string): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(`${this.endpoint}/${id}/cancelar`, {})
      .pipe(map((res) => new Order(this.formatOrder(res.encomenda))));
  }

  confirmarRececao(id: string): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(`${this.endpoint}/${id}/confirmar-rececao`, {})
      .pipe(map((res) => new Order(this.formatOrder(res.encomenda))));
  }
}
