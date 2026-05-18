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
    metodoPagamento: string;
    moradaEntrega?: string;
    codigoCupao?: string;
    coordenadasEntrega?: { lat: number; lng: number };
  }): Observable<Order> {
    return this.http
      .post<OrderResponseDTO>(this.endpoint, dados)
      .pipe(map((res) => new Order(this.formatOrder(res.encomenda))));
  }

  meusCupoes(): Observable<
    {
      _id: string;
      codigo: string;
      percentagemDesconto: number;
      supermercadoId: string | null;
      supermercado: string | null;
      tipoDesconto?: 'percentagem' | 'valor';
      valorDesconto?: number;
      expirado: boolean;
    }[]
  > {
    return this.http
      .get<{
        sucesso: boolean;
        cupoes: {
          _id: string;
          codigo: string;
          percentagemDesconto: number;
          supermercadoId: string | null;
          supermercado: string | null;
          tipoDesconto?: 'percentagem' | 'valor';
          valorDesconto?: number;
          expirado: boolean;
        }[];
      }>(`${API_URL}/users/cupoes`)
      .pipe(map((res) => res.cupoes));
  }

  validarCupao(
    codigo: string,
    supermercadoId: string,
  ): Observable<{
    sucesso: boolean;
    percentagemDesconto: number;
    tipoDesconto: 'percentagem' | 'valor';
    valorDesconto: number;
    cupaoId: string;
  }> {
    return this.http.post<{
      sucesso: boolean;
      percentagemDesconto: number;
      tipoDesconto: 'percentagem' | 'valor';
      valorDesconto: number;
      cupaoId: string;
    }>(
      `${this.endpoint}/validar-cupao`,
      {
        codigo,
        supermercadoId,
      },
    );
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

 

  private formatOrder(order: OrderDTO): OrderDTO {
    if (order.produtos) {
      order.produtos.forEach((item) => {
        if (item.produtoId && typeof item.produtoId !== 'string') {
          item.produtoId.imagem = formatImageUrl(item.produtoId.imagem);
        }
      });
    }
    return order;
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
