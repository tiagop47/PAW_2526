import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../app.config';
import { ReclamacaoDTO, ReclamacaoResponseDTO, ReclamacoesResponseDTO } from '../models/reclamacao.dto';

@Injectable({
  providedIn: 'root',
})
export class ReclamacaoService {
  private endpoint = `${API_URL}/reclamacoes`;

  constructor(private http: HttpClient) {}

  listarMinhas(): Observable<ReclamacoesResponseDTO> {
    return this.http.get<ReclamacoesResponseDTO>(this.endpoint);
  }

  criar(dados: {
    supermercadoId?: string;
    encomendaId?: string;
    categoria: string;
    assunto: string;
    descricao: string;
  }): Observable<ReclamacaoResponseDTO> {
    return this.http.post<ReclamacaoResponseDTO>(this.endpoint, dados);
  }
}
