import { CategoryDTO } from './category.dto';

export interface ProductDTO {
  _id: string;
  supermercadoId: any; // Pode vir ID ou Objecto populado
  nome: string;
  descricao?: string;
  categoriaId: CategoryDTO;
  preco: number;
  precoAntigo?: number;
  stockDisponivel: number;
  imagem: string;
  codigoBarras?: string;
  criadoEm?: string;
}

export interface ProductComparacaoDTO {
  _id: string;
  nome: string;
  preco: number;
  stockDisponivel: number;
  imagem: string;
  supermercadoId: {
    _id: string;
    nome: string;
    localizacao: string;
  };
}
