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


const WebSocketServer = require('websocket').server;

const http = require('http');
const url = require('url');
const net = require('net');
const logger = require('debug')('WstServerReverse');

const BindSocketsReverse = require('./bindSockets_reverse');


const { EventEmitter } = require('events');
let newWSTCP_DATA = new EventEmitter();

class WstServerReverse {
  constructor(secret) {
    this.isConnected = false;
    this.secret = secret;
    this.httpServer = http.createServer(function(request, response) {
      response.writeHead(404);
      return response.end();
    });

    this.wsServerForControl = new WebSocketServer({
      httpServer: this.httpServer,
      autoAcceptConnections: false
    });
  }

  start(port) {
    this.httpServer.listen(port, function() {
      logger(`Server is listening on port: ${port}`);
      return
    }.bind(this));

    this.wsServerForControl.on('request', (function(_this){
      return function(request) {
        // One TCP Server for each client WS Request
        request.tcpServer = new net.createServer();

        const uri = url.parse(request.httpRequest.url, true);
        if (uri.query.dst !== undefined) {
          // One TCP Server for each client WS Request
          request.tcpServer = new net.createServer();

          const remoteAddr = uri.query.dst;
          const [, portTcp] = remoteAddr.split(':');

          // start tcp server
          request.tcpServer.listen(portTcp);
          logger(`Created TCP server on port: ${portTcp}`);

          // add accept header
          request.wsConnectionForControl = request.accept('tunnel-protocol', request.origin);

          // start message
          logger('WS Connection for Control Created');

          request.wsConnectionForControl.on('close', function(reasonCode, description) {
            logger(`WebSocket Control Peer ${request.wsConnectionForControl.remoteAddress} disconnected for: ${description}`);
            logger(`Close TCP server on port ${portTcp}`);

            request.tcpServer.close();
          });
        } else{
          logger('Request for Data WS Socket');
          newWSTCP_DATA.emit('created', request);
        }

        // Manage TCP Connection
        request.tcpServer.on('connection', (function(_this){
          return function(tcpConn) {
            tcpConn.wsConnection;

            // Putting in pause the tcp connection waiting the new socket WS Socket for data
            tcpConn.pause();
            const idConnection = nextConnectionIntId();
            const msgForNewConnection = `NC:${idConnection}`;
            request.wsConnectionForControl.sendUTF(msgForNewConnection);
            newWSTCP_DATA.on('created', (function(_this){
              return function(request) {
                const uri = url.parse(request.httpRequest.url, true);
                if (idConnection === uri.query.id) {
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

let nextId = 1000;
function nextConnectionIntId(){
  return nextId++;
}
