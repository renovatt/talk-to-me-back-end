import http from 'http'
import { Server, Socket } from 'socket.io'
import express, { Application } from 'express'

class App {
  private app: Application;
  private http: http.Server;
  private io: Server;

  constructor() {
    this.app = express();
    this.http = new http.Server(this.app);
    this.io = new Server(this.http, {
      cors: {
        origin: '*',
      }
    });
  }

  public listen() {
    this.http.listen(3333, () => {
      console.log('listening on port: 3333');
    });
  }

  public listenSocket() {
    this.io.of('/streams').on('connection', this.socketEvents);
  }

  private socketEvents(socket: Socket) {
    console.log('Socket connected: ' + socket.id)
    socket.on('subscribe', (data) => {
      console.log('room: ' + data.roomId);
      socket.join(data.roomId);
      socket.join(data.socketId);

      const roomsSession = Array.from(socket.rooms);

      if (roomsSession.length > 1) {
        socket.to(data.roomId).emit('new-user', {
          socketId: socket.id,
          username: data.username,
        });
      }
    });

    socket.on('newUserStart', (data) => {
      console.log('new user connected: ', data)
      socket.to(data.to).emit('newUserStart', { 
        sender: data.sender
       });
    });

    socket.on('sdp', (data) => {
      console.log('sdp: ', data)
      socket.to(data.to).emit('sdp', {
        description: data.description,
        sender: data.sender,
      });
    });

    socket.on('ice-candidates', (data) => {
      console.log('ice-candidates: ', data)
      socket.to(data.to).emit('ice-candidates', {
        candidate: data.candidate,
        sender: data.sender,
      });
    });

    socket.on('chat', (data) => {
      console.log(data)
      socket.broadcast.to(data.roomId).emit('chat', {
        message: data.message,
        username: data.username,
        time: data.time,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected: ' + socket.id)
      socket.disconnect();
    });
  }
}

export { App }