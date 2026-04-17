class UserDTO {
    constructor(user) {
        this.id = user._id;
        this.nome = user.nome;
        this.email = user.email;
        this.role = user.role;
        this.telefone = user.telefone;
        this.nif = user.nif;
        this.morada = user.morada;
    }
}

module.exports = UserDTO;
