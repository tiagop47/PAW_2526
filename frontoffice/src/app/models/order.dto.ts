export interface OrderItemDTO {
  produtoId: {
    _id: string;
    nome: string;
    imagem: string;
    preco?: number;
  };
  quantidade: number;
  precoUnitario: number;
}

export interface OrderDTO {
  _id: string;
  supermercadoId: {
    _id: string;
    nome: string;
    localizacao: string;
  };
  clienteId: string;
  estafetaId?: {
    nome: string;
    telefone: string;
  };
  produtos: OrderItemDTO[];
  valorTotal: number;
  estado: 'pendente' | 'confirmada' | 'preparacao' | 'em_entrega' | 'aguarda_confirmacao' | 'entregue' | 'cancelada';
  metodoEntrega: 'levantamento_loja' | 'entrega_domicilio';
  moradaEntrega?: string;
  confirmadaEm?: string;
  criadoEm: string;
}
