export interface ReclamacaoDTO {
  _id: string;
  clienteId: string;
  supermercadoId?: {
    _id: string;
    nome: string;
    localizacao: string;
  };
  encomendaId?: {
    _id: string;
    criadoEm: string;
    valorTotal: number;
    estado: string;
  };
  categoria: 'produto' | 'entrega' | 'pagamento' | 'atendimento' | 'outro';
  assunto: string;
  descricao: string;
  estado: 'pendente' | 'em_analise' | 'resolvida';
  respostaSupermercado?: string;
  respostaAdmin?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ReclamacoesResponseDTO {
  reclamacoes: ReclamacaoDTO[];
}

export interface ReclamacaoResponseDTO {
  reclamacao: ReclamacaoDTO;
}
