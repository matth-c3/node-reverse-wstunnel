//###############################################################################
//##
//# Copyright (C) 2014-2017 Andrea Rocco Lotronto
//##
//# Licensed under the Apache License, Version 2.0 (the 'License');
//# you may not use this file except in compliance with the License.
//# You may obtain a copy of the License at
//##
//# http://www.apache.org/licenses/LICENSE-2.0
//##
//# Unless required by applicable law or agreed to in writing, software
//# distributed under the License is distributed on an 'AS IS' BASIS,
//# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//# See the License for the specific language governing permissions and
//# limitations under the License.
//##
//###############################################################################

const logger = require('debug')('BindSocketsReverse');

class BindSocketsReverse{
  constructor(wsP, tcpP){
    this.wsconn = wsP;
    this.tcpconn = tcpP;
  }

  start(){
    //Bind WS management Event
    this.wsconn.isPaused = false;

    this.wsconn.on('message', ((message) => {
      if (message.type === 'utf8') {
        logger('Error, text messages is not supported by Reverse WS-Tunnel');
        return;
      } else if (message.type === 'binary') {
        if (false === this.tcpconn.write(message.binaryData)) {
          this.wsconn.socket.pause();
          this.wsconn.isPaused = true;
          return '';
        } else {
          if (true === this.wsconn.isPaused) {
            this.wsconn.socket.resume();

            return this.wsconn.isPaused = false;
          }
        }
      }
    }).bind(this));

    this.wsconn.on('overflow', (() => {
      logger('TCP connection paused for WS OVERFLOW');
      return this.tcpconn.pause();
    }).bind(this));

    this.wsconn.socket.on('drain', (() => {
      logger('TCP connection resume for WS DRAIN');
      return this.tcpconn.resume();
    }).bind(this));

    this.wsconn.on('error', logger);

    this.wsconn.on('close', ((reasonCode, description) => {
      logger(`WebSocket Peer ${this.wsconn.remoteAddress} disconnected for: ${description}`);
      return this.tcpconn.destroy();
    }).bind(this));


    // Bind TCP management Event
    this.tcpconn.on('drain', (() => {
      this.wsconn.socket.resume();
      logger('WS resumed');
      return this.wsconn.isPaused = false;
    }).bind(this));

    this.tcpconn.on('data', ((buffer) {
      logger('TCP DATA');
      return this.wsconn.sendBytes(buffer);
    }).bind(this));

    this.tcpconn.on('error', ((err) {
      logger(`TCP Error ${err}`);
      return this.tcpconn.destroy();
    }).bind(this));

    this.tcpconn.on('close', (() {
      logger('TCP connection Close');
      return this.wsconn.close();
    }).bind(this));
  }
}

module.exports = BindSocketsReverse;
