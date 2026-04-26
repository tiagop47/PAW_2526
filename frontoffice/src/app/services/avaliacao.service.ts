import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../app.config';

import { AvaliacaoDTO } from '../models/avaliacao.dto';

export interface CriarAvaliacaoDTO {
  encomendaId: string;
  notaSupermercado: number;
  notaEstafeta?: number;
  comentario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AvaliacaoService {
  private apiUrl = `${API_URL}/avaliacoes`;

  constructor(private http: HttpClient) {}

  criarAvaliacao(dados: CriarAvaliacaoDTO): Observable<any> {
    return this.http.post(this.apiUrl, dados);
  }

  getMinhasAvaliacoes(): Observable<AvaliacaoDTO[]> {
    return this.http.get<AvaliacaoDTO[]>(this.apiUrl);
  }
}
