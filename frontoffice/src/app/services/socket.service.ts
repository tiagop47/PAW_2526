import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly url = 'http://localhost:3000'; 

  constructor() {
    this.socket = io(this.url, {
      withCredentials: true,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Conectado ao servidor WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado do servidor WebSocket');
    });
  }

  joinRoom(room: string) {
    this.socket.emit('join-room', room);
  }

  onEvent(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  emitEvent(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
