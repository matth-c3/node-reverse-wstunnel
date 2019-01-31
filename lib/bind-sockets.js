const logger = require('debug')('BindSocketsReverse');

class BindSocketsReverse {
  constructor (websocket, tcp) {
    this.websocket = websocket;
    this.tcp = tcp;
  }

  start () {
    // Bind WS management Event
    this.websocket.isPaused = false;

    this.websocket.on('message', (message) => {
      if (message.type === 'utf8') {
        logger('Error, text messages is not supported by Reverse WS-Tunnel');
      } else if (message.type === 'binary') {
        if (!this.tcp.write(message.binaryData)) {
          this.websocket.socket.pause();
          this.websocket.isPaused = true;
        } else {
          if (this.websocket.isPaused) {
            this.websocket.socket.resume();

            this.websocket.isPaused = false;
          }
        }
      }
    });

    this.websocket.on('overflow', () => {
      logger('TCP connection paused for WS OVERFLOW');
      this.tcp.pause();
    });

    this.websocket.socket.on('drain', () => {
      logger('TCP connection resume for WS DRAIN');
      this.tcp.resume();
    });

    this.websocket.on('error', logger);

    this.websocket.on('close', (reasonCode, description) => {
      logger(`WebSocket Peer ${this.websocket.remoteAddress} disconnected for: ${description}`);
      this.tcp.destroy();
    });

    // Bind TCP management Event
    this.tcp.on('drain', () => {
      this.websocket.socket.resume();
      logger('WS resumed');
      this.websocket.isPaused = false;
    });

    this.tcp.on('data', (buffer) => {
      logger('TCP DATA');
      this.websocket.sendBytes(buffer);
    });

    this.tcp.on('error', (error) => {
      logger(`TCP Error ${error}`);
      this.tcp.destroy();
    });

    this.tcp.on('close', () => {
      logger('TCP connection Close');
      this.websocket.close();
    });
  }
}

module.exports = BindSocketsReverse;
