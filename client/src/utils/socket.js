import { io } from "socket.io-client";

let _socket = null;

export function getSocket() {
  if (!_socket) {
    _socket = io({ transports: ["websocket", "polling"] });
  }
  return _socket;
}
