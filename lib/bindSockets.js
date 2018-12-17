// ###############################################################################
// ##
// # Copyright (C) 2014-2017 Andrea Rocco Lotronto
// ##
// # Licensed under the Apache License, Version 2.0 (the 'License');
// # you may not use this file except in compliance with the License.
// # You may obtain a copy of the License at
// ##
// # http://www.apache.org/licenses/LICENSE-2.0
// ##
// # Unless required by applicable law or agreed to in writing, software
// # distributed under the License is distributed on an 'AS IS' BASIS,
// # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// # See the License for the specific language governing permissions and
// # limitations under the License.
// ##
// ###############################################################################

const logger = require('debug')('BindSockets');

class BindSockets {
  constructor (wsconn, tcpconn) {
    this.wsconn = wsconn;
    this.tcpconn = tcpconn;
  }

  start () {
    this.wsconn.isPaused = false;

    this.wsconn.on('message', (message) => {
      if (message.type === 'utf8') {
        logger('Error, Not supposed to received message ');
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

    this.tcpconn.on('drain', () => {
      this.wsconn.socket.resume();
      this.wsconn.isPaused = false;
    });

    this.tcpconn.on('data', (buffer) => {
      this.wsconn.sendBytes(buffer);
    });

    this.tcpconn.on('error', logger);

    this.tcpconn.on('close', () => {
      logger(`tunnel disconnected.`);
      this.wsconn.close();
    });

    this.wsconn.on('overflow', () => {
      this.tcpconn.pause();
    });

    this.wsconn.socket.on('drain', () => {
      this.tcpconn.resume();
    });

    this.wsconn.on('error', logger);

    this.wsconn.on('close', (reasonCode, description) => {
      logger(`ws Peer ${this.wsconn.remoteAddress} disconnected for: ${description}`);
      this.tcpconn.destroy();
    });
  }
}

module.exports = BindSockets;
