export interface SupermarketDTO {
  _id: string;
  nome: string;
  descricao?: string;
  localizacao: string;
  metodosEntrega?: string[];
}
