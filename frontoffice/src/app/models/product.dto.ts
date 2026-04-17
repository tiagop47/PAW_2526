import { CategoryDTO } from './category.dto';

export interface ProductDTO {
  _id: string;
  supermercadoId: string;
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
