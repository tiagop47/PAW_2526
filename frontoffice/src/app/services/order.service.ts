import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OrderDTO } from '../models/order.dto';
import { Order } from '../models/order';
import { API_URL } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private endpoint = `${API_URL}/orders`;

  constructor(private http: HttpClient) { }

  criarEncomenda(dados: {
    supermercadoId: string;
    produtos: { produtoId: string; quantidade: number }[];
    metodoEntrega: string;
    moradaEntrega?: string;
    coordenadasEntrega?: { lat: number; lng: number };
  }): Observable<Order> {
    return this.http.post<any>(this.endpoint, dados).pipe(
      map(res => new Order(res.encomenda || res))
    );
  }

  listarEncomendas(): Observable<Order[]> {
    return this.http.get<any>(this.endpoint).pipe(
      map(res => {
        const data = res.encomendas || res;
        return Array.isArray(data) ? data.map((dto: any) => new Order(dto)) : [];
      })
    );
  }

  obterEncomenda(id: string): Observable<Order> {
    return this.http.get<any>(`${this.endpoint}/${id}`).pipe(
      map(res => new Order(res.encomenda || res))
    );
  }

  cancelarEncomenda(id: string): Observable<Order> {
    return this.http.post<any>(`${this.endpoint}/${id}/cancelar`, {}).pipe(
      map(res => new Order(res.encomenda || res))
    );
  }

  confirmarRececao(id: string): Observable<Order> {
    return this.http.post<any>(`${this.endpoint}/${id}/confirmar-rececao`, {}).pipe(
      map(res => new Order(res.encomenda || res))
    );
  }
}
