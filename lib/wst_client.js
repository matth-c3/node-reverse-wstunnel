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

const net = require('net');
const WebSocketClient = require('websocket').client;
const BindSockets = require('./bindSockets');
const logger = require('debug')('WstClient');

class WstClient {
  constructor() {
    this.tcpServer = net.createServer();
  }

  start(localPort, wsHostUrl, remoteAddr){
    this.tcpServer.listen(localPort);

    this.tcpServer.on('connection', (function(_this) {
      return function(tcpConn) {
        let url, wsClient;
        logger('Connection detected');
        wsClient = new WebSocketClient();
        wsClient.on('connectFailed', function(error) {
          logger(`WS connect error: ${error.toString()}`);
          return tcpConn.destroy();
        });
        wsClient.on('connect', function(wsConn) {
          logger('WebSocket connected, binding tunnel');
          let myBind = new BindSockets(wsConn, tcpConn);
          myBind.start();
          return myBind;
        });

        if (remoteAddr) {
          url = `${wsHostUrl}/?dst=${remoteAddr}`;
        } else {
          url = wsHostUrl;
        }

        return wsClient.connect(url, 'tunnel-protocol');
      };
    })(this));
  }
}

module.exports = WstClient;
