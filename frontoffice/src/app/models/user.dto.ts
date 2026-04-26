export interface UserDTO {
  _id: string;
  nome: string;
  email: string;
  role: 'cliente' | 'estafeta' | 'admin';
  telefone: string;
  nif?: string;
  morada: string;
  supermercadoFavorito?: string;
  token?: string;
}
