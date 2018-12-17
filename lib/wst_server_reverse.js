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

const WebSocketServer = require('websocket').server;
const http = require('http');
const { URLSearchParams } = require('url');
const net = require('net');
const _ = require('lodash');
const randomstring = require('randomstring');
const simpleEncryptor = require('simple-encryptor');
const BindSocketsReverse = require('./bindSockets_reverse');
const { EventEmitter } = require('events');
const logger = require('debug')('WstServerReverse');
const newWSTCPEmitter = new EventEmitter();

class WstServerReverse {
  constructor (secret) {
    const httpServer = http.createServer((request, response) => {
      response.writeHead(404);

      return response.end();
    });

    const wsServerForControl = new WebSocketServer({
      httpServer,
      autoAcceptConnections: false,
    });

    this.isConnected = false;
    this.secret = secret;
    this.httpServer = httpServer;
    this.wsServerForControl = wsServerForControl;
  }

  start (port) {
    this.httpServer.listen(port, () => {
      logger(`Server is listening on port: ${port}`);
    });

    this.wsServerForControl.on('request', ((_this) => {
      return (request) => {
        // One TCP Server for each client WS Request
        request.tcpServer = net.createServer();

        // parse to http uri
        const uri = new URLSearchParams(_.get(request, 'httpRequest.url', '').replace(/^\//, ''));
        if (uri.get('dst') !== undefined) {
          // One TCP Server for each client WS Request
          request.tcpServer = net.createServer();

          const portTcp = uri.get('dst');

          // start tcp server
          request.tcpServer.listen(portTcp);
          logger(`Created TCP server on port: ${portTcp}`);

          // add accept header
          request.wsConnectionForControl = request.accept('tunnel-protocol', request.origin);

          // start message
          logger('WS Connection for Control Created');

          request.wsConnectionForControl.on('close', (reasonCode, description) => {
            logger(`WebSocket Control Peer ${_.get(request, 'wsConnectionForControl.remoteAddress')} disconnected for: ${description}`);
            logger(`Close TCP server on port ${portTcp}`);

            request.tcpServer.close();
          });
        } else {
          logger('Request for Data WS Socket');

          // emit request
          newWSTCPEmitter.emit('created', request);
        }

        // Manage TCP Connection
        request.tcpServer.on('connection', ((_this) => {
          return (tcpConn) => {
            // Putting in pause the tcp connection waiting the new socket WS Socket for data
            tcpConn.pause();

            // create connection
            const idConnection = randomstring.generate(8);
            const msgForNewConnection = `NC:${idConnection}`;

            // send utf message for new connection
            request.wsConnectionForControl.sendUTF(msgForNewConnection);
            newWSTCPEmitter.on('created', ((_this) => {
              return (request) => {
                const encryptor = simpleEncryptor(_this.secret);
                const requestUrl = _.get(request, 'httpRequest.url', '');
                const uri = new URLSearchParams(requestUrl.replace(/^\//, ''));
                const id = uri.get('id');
                const token = uri.get('token');
                const decrypted = encryptor.decrypt(token);

                // check connection state
                if (idConnection === id && decrypted === id) {
                  tcpConn.wsConnection = request.accept('tunnel-protocol', request.origin);
                  const myBind = new BindSocketsReverse(tcpConn.wsConnection, tcpConn);

                  // start bind service
                  myBind.start();

                  // Resuming of the tcp connection after WS Socket is just created
                  tcpConn.resume();

                  // set connected
                  _this.isConnected = true;
                }
              };
            })(this));
          };
        })(_this));
      };
    })(this));
  }
}

module.exports = WstServerReverse;
