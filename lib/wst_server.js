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
const _ = require('lodash');
const logger = require('debug')('WstServer');
const BindSockets = require('./bindSockets');

class WstServer {
  constructor(dstHost, dstPort) {
    this.dstHost = dstHost;
    this.dstPort = dstPort;
    this.httpServer = http.createServer((request, response) => {
      logger(`Received unhandled request for ${request.url}`);
      response.writeHead(404);
      return response.end();
    });

    this.wsServer = new WebSocketServer(
      {
        httpServer: this.httpServer,
        autoAcceptConnections: false
      }
    );
  }

  start(port) {
    this.httpServer.listen(port, () => {
      logger(`Server is listening on port ${port}`);
    });

    this.wsServer.on('request', ((_this) => {
      return (request) => {
        const uri = url.parse(_.get(request, 'httpRequest.url'), true);
        let [host, port] = [_this.dstHost, _this.dstPort];

        if (_.isUndefined(host) && _.isUndefined(port)) {
          if (!uri.query.dst) {
            return _this._reject(request, 'No tunnel target specified');
          }

          // check destination from url query
          const [refHost, refPort] = uri.query.dst.split(':');

          // assign reference
          host = refHost;
          port = refPort;
        }

        const tcpconn = net.connect({ port, host }, () => {
          logger(`Establishing tunnel to ${host}:${port}`);
          const wsconn = request.accept('tunnel-protocol', request.origin);
          const myBind = new BindSockets(wsconn, tcpconn);

          // start binding
          myBind.start();

          return myBind;
        });
      };
    })(this));
  }

  _reject(request, msg) {
    request.reject();

    // log message
    logger(`Connection from ${request.remoteAddress} rejected: ${msg}`);
  }
}


module.exports = WstServer;
