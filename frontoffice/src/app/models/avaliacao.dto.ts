export interface AvaliacaoDTO {
  _id: string;
  encomendaId: string;
  notaSupermercado: number;
  notaEstafeta?: number;
  comentario?: string;
  criadoEm: string;
  supermercadoId?: {
    _id: string;
    nome: string;
  };
  estafetaId?: {
    _id: string;
    nome: string;
  };
}
