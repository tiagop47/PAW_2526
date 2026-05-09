const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on("connection", (socket) => {
      console.log("Novo cliente ligado:", socket.id);

      socket.on("join-room", (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} juntou-se à sala: ${room}`);
      });

      socket.on("disconnect", () => {
        console.log("Cliente desligado:", socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io não inicializado!");
    }
    return io;
  }
};
