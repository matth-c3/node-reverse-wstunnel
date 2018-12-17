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
const { URL } = require('url');
const buildUrl = require('build-url');
const simpleEncryptor = require('simple-encryptor');
const WebSocketClient = require('websocket').client;
const BindSockets = require('./bindSockets_reverse');
const logger = require('debug')('WstClientReverse');

class WstClientReverse {
  constructor (secret) {
    this.secret = secret;
    this.wsClientForControl = new WebSocketClient();
  }

  start (portForTunnel, tunneledPort, addressToTunneled) {
    // Getting parameter
    const urlWsHostObj = new URL(addressToTunneled);
    console.log(urlWsHostObj);
    const remoteHost = urlWsHostObj.host;
    const remotePort = urlWsHostObj.port;

    // QUERY STRING IS CREATED TO REALIZE A NEW CONNECTION
    const wsUrl = buildUrl(
      addressToTunneled,
      {
        queryParams: {
          dst: tunneledPort,
        },
      },
    );

    console.log(wsUrl);

    // Connection to Control WS Server
    this.wsClientForControl.connect(wsUrl, 'tunnel-protocol');
    this.wsClientForControl.on('connect', ((_this) => {
      return (wsConnectionForControl) => {
        logger(`wsClientForControl for Control connected`);

        wsConnectionForControl.on('message', (message) => {
          logger(`Message for new TCP Connection on WS Server: ${message.utf8Data}`);
          const [tag, id] = message.utf8Data.split(':');

          // Managing new TCP connection on WS Server
          if (tag === 'NC') {
            const encryptor = simpleEncryptor(_this.secret);
            const wsUrlWithId = buildUrl(
              addressToTunneled,
              {
                queryParams: {
                  id,
                  token: encryptor.encrypt(id),
                },
              },
            );

            // Identification of ID connection
            this.wsClientData = new WebSocketClient();
            this.wsClientData.connect(wsUrlWithId, 'tunnel-protocol');
            logger(`Call WS-Server for connect id: ${id}`);

            // Management of new WS Client for every TCP connection on WS Server
            this.wsClientData.on('connect', (() => {
              return (wsConnectionForData) => {
                // Waiting of WS Socket with WS Server
                wsConnectionForData.socket.pause();
                logger(`WebSocket Paused`);
                logger(`Connected wsClientData to WS-Server for id: ${id} on localport: ${wsConnectionForData.socket.localPort}`);
                logger(`Start PIPE wsConnectionForData TCP client to: ${remoteHost}:${remotePort}`);

                // create tcp connection
                tcpConnection(wsConnectionForData, remoteHost, remotePort);
              };
            })(this));
          }
        });
      };
    })(this));

    // Management of WS Connection failed
    this.wsClientForControl.on('connectFailed', (error) => {
      logger(`WS connect error: ${error.toString()}`);
    });
  }
}

function tcpConnection (wsConn, host, port) {
  const tcpConn = net.connect({ port, host }, () => {});

  tcpConn.on('connect', () => {
    const myBind = new BindSockets(wsConn, tcpConn);

    // Start binding with tcp connection
    myBind.start();

    // Resume of the WS Socket after the connection to WS Server
    wsConn.socket.resume();
  });

  tcpConn.on('error', logger);
}

module.exports = WstClientReverse;
