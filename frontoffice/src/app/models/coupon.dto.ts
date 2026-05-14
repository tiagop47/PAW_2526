export interface CouponDTO {
  _id: string;
  codigo: string;
  tipoDesconto?: 'percentagem' | 'valor';
  percentagemDesconto: number;
  valorDesconto?: number;
  origem?: 'supermercado' | 'boas_vindas' | 'fidelidade';
  prazo: string;
  ativo: boolean;
  supermercadoId?: string; 
  supermercado?: string;  
  sLocalizacao: string;
  expirado: boolean;
}
