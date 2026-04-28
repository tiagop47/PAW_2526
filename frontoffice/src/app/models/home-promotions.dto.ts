import { CouponDTO } from './coupon.dto';

export interface StorePromotionDTO {
  _id: string;
  nome: string;
  localizacao: string;
  mediaDescontoPercent: number;
}

export interface HomePromotionsDTO {
  lojas: StorePromotionDTO[];
  cupoes: CouponDTO[];
}
