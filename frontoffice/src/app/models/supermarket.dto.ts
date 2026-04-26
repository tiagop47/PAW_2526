export interface SupermarketDTO {
  _id: string;
  nome: string;
  descricao?: string;
  localizacao: string;
  metodosEntrega?: string[];
  localizacaoGeo?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  raioEntregaKm?: number;
}
