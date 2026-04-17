import { Category } from "./category";

export interface Product {
  _id: string;
  supermercadoId: string;
  nome: string;
  descricao?: string;
  categoriaId: Category;
  preco: number;
  precoAntigo?: number;
  stockDisponivel: number;
  imagem: string;
  codigoBarras?: string;
  criadoEm?: string;
}
