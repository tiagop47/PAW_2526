import { CategoryDTO } from './category.dto';

export interface ProductDTO {
  _id: string;
  supermercadoId: { _id: string; nome: string; localizacao: string };
  catalogProductId?: { _id: string; nome: string } | null;
  nome: string;
  descricao?: string;
  categoriaId: CategoryDTO;
  preco: number;
  precoAntigo?: number;
  stockDisponivel: number;
  iva: number;
  imagem: string;
  codigoBarras?: string;
  criadoEm?: string;
}

export type ProductComparacaoDTO = Pick<ProductDTO, '_id' | 'nome' | 'preco' | 'stockDisponivel' | 'imagem' | 'supermercadoId'>;
