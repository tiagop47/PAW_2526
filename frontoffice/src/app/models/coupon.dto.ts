export interface CouponDTO {
  _id: string;
  codigo: string;
  percentagemDesconto: number;
  prazo: string;
  ativo: boolean;
  supermercadoId?: string; 
  supermercado?: string;  
  sLocalizacao: string;
  expirado: boolean;
}
