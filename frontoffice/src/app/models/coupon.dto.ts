export interface CouponDTO {
  _id: string;
  codigo: string;
  percentagemDesconto: number;
  prazo: string;
  ativo: boolean;
  supermercadoId?: {
    _id: string;
    nome: string;
  };
}
