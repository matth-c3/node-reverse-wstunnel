//###############################################################################
//##
//# Copyright (C) 2014-2017 Andrea Rocco Lotronto
//##
//# Licensed under the Apache License, Version 2.0 (the "License");
//# you may not use this file except in compliance with the License.
//# You may obtain a copy of the License at
//##
//# http://www.apache.org/licenses/LICENSE-2.0
//##
//# Unless required by applicable law or agreed to in writing, software
//# distributed under the License is distributed on an "AS IS" BASIS,
//# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//# See the License for the specific language governing permissions and
//# limitations under the License.
//##
//###############################################################################

const WebSocketServer = require('websocket').server;
const http = require('http');
const url = require("url");
const net = require("net");

const logger = require("./wst_logger");
const BindSockets = require("./bindSockets");


class WstServer {
    constructor(dstHost, dstPort) {
        this.dstHost = dstHost;
        this.dstPort = dstPort;
        this.httpServer = http.createServer(function (request, response) {
            logger((new Date()) + ' Received unhandled request for ' + request.url);
            response.writeHead(404);
            return response.end();
        });
        this.wsServer = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        });
    }

    start(port) {
        this.httpServer.listen(port, function () {
            logger((new Date()) + (" Server is listening on port " + port));
            return
        }.bind(this));


        this.wsServer.on('request', (function (_this) {
            return function (request) {
                let host,remoteAddr,tcpconn,uri,_ref,_ref1,port;

                if (!_this.originIsAllowed(request.origin)) {
                    return _this._reject(request, "Illegal origin " + origin);
                }
                uri = url.parse(request.httpRequest.url, true);
                _ref = [_this.dstHost, _this.dstPort];
                host = _ref[0];
                port = _ref[1];

                if (host && port) {
                    remoteAddr = "" + host + ":" + port;
                } else {
                    if (!uri.query.dst) {
                        return _this._reject(request, "No tunnel target specified");
                    }
                    remoteAddr = uri.query.dst;
                    _ref1 = remoteAddr.split(":"),host = _ref1[0], port = _ref1[1];
                }
                tcpconn = net.connect({port: port, host: host}, function () {
                    let wsconn;
                    logger((new Date()) + ' Establishing tunnel to ' + remoteAddr);
                    wsconn = request.accept('tunnel-protocol', request.origin);
                    let myBind = new BindSockets(wsconn, tcpconn);
                    myBind.start();
                    return myBind;
                });
                /*return tcpconn.on("error", function (err) {
                    return this._reject(request, "Tunnel connect error to " + remoteAddr + ": " + err);
                });*/
            };
        })(this));
    }

    originIsAllowed(origin) {
        return true;
    }

    _reject(request, msg) {
        request.reject();
        logger((new Date()) + ' Connection from ' + request.remoteAddress + ' rejected: ' + msg);
        return;
    }
}


module.exports = WstServer;
