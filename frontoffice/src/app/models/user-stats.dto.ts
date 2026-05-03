export interface UserStats {
  totalEncomendas: number;
  produtosMaisComprados: {
    _id: string;
    nome: string;
    imagem: string;
    totalQuantidade: number;
  }[];
}