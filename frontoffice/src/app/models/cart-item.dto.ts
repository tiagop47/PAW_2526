export interface CartItem {
  produtoId: string;
  nome: string;
  imagem: string;
  preco: number;
  quantidade: number;
  stockDisponivel: number;
  supermercadoId: string;
  supermercadoNome: string;
  iva: number;
}
