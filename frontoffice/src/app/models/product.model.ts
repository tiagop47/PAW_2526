export interface Product {
  _id?: string;
  nome: string;
  preco: number;
  descricao?: string;
  imagem: string;
  categoriaId?: any;
  supermercadoId?: any;
}
