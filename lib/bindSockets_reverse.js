const logger = require('debug')('BindSocketsReverse');

class BindSocketsReverse {
  constructor (wsP, tcpP) {
    this.wsconn = wsP;
    this.tcpconn = tcpP;
  }

  start () {
    // Bind WS management Event
    this.wsconn.isPaused = false;

    this.wsconn.on('message', (message) => {
      if (message.type === 'utf8') {
        logger('Error, text messages is not supported by Reverse WS-Tunnel');
      } else if (message.type === 'binary') {
        if (this.tcpconn.write(message.binaryData) === false) {
          this.wsconn.socket.pause();
          this.wsconn.isPaused = true;
        } else {
          if (this.wsconn.isPaused === true) {
            this.wsconn.socket.resume();

            this.wsconn.isPaused = false;
          }
        }
      }
    });

    this.wsconn.on('overflow', () => {
      logger('TCP connection paused for WS OVERFLOW');
      this.tcpconn.pause();
    });

    this.wsconn.socket.on('drain', () => {
      logger('TCP connection resume for WS DRAIN');
      this.tcpconn.resume();
    });

    this.wsconn.on('error', logger);

    this.wsconn.on('close', (reasonCode, description) => {
      logger(`WebSocket Peer ${this.wsconn.remoteAddress} disconnected for: ${description}`);
      this.tcpconn.destroy();
    });

    // Bind TCP management Event
    this.tcpconn.on('drain', () => {
      this.wsconn.socket.resume();
      logger('WS resumed');
      this.wsconn.isPaused = false;
    });

    this.tcpconn.on('data', (buffer) => {
      logger('TCP DATA');
      this.wsconn.sendBytes(buffer);
    });

    this.tcpconn.on('error', (error) => {
      logger(`TCP Error ${error}`);
      this.tcpconn.destroy();
    });

    this.tcpconn.on('close', () => {
      logger('TCP connection Close');
      this.wsconn.close();
    });
  }
}

module.exports = BindSocketsReverse;
