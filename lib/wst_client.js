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

const net = require('net');
const WebSocketClient = require('websocket').client;
const BindSockets = require('./bindSockets');
const logger = require('debug')('WstClient');
const buildUrl = require('build-url');

class WstClient {
  constructor () {
    this.tcpServer = net.createServer();
  }

  start (localPort, wsHostUrl, remoteAddr) {
    this.tcpServer.listen(localPort);

    this.tcpServer.on('connection', ((_this) => {
      return (tcpConn) => {
        logger('Connection detected');
        const wsClient = new WebSocketClient();

        wsClient.on('connectFailed', (error) => {
          logger(`WS connect error: ${error.toString()}`);
          tcpConn.destroy();
        });

        wsClient.on('connect', (wsConn) => {
          logger('WebSocket connected, binding tunnel');
          const myBind = new BindSockets(wsConn, tcpConn);
          myBind.start();
        });

        const url = remoteAddr
          ? buildUrl(wsHostUrl, { queryParams: { dst: remoteAddr } })
          : wsHostUrl;

        return wsClient.connect(url, 'tunnel-protocol');
      };
    })(this));
  }
}

module.exports = WstClient;
