export interface UserDTO {
  _id: string;
  nome: string;
  email: string;
  role: string;
  telefone: string;
  nif?: string;
  morada: string;
  supermercadoFavorito?: string;
  token?: string;
}

export interface LoginResponseDTO {
  token: string;
  role: string;
  user: UserDTO;
}

export interface UserResponseDTO {
  sucesso: boolean;
  user: UserDTO;
}
