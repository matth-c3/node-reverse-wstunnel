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

const BindSocketsReverse = require("./bindSockets_reverse");


const eventEmitter = require('events').EventEmitter;
let newWSTCP_DATA = new eventEmitter();

class WstServerReverse {
    constructor(port){
        this.port = port;
        this.httpServer = http.createServer(function(request, response) {
            response.writeHead(404);
            return response.end();
        });

        this.wsServerForControll = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        });
    }

    start(){
        this.httpServer.listen(this.port, function() {
            logger('[wst_server_reverse.start]'+(new Date())+ 'Server is listening on port: ' + this.port);
            return
        }.bind(this));

        this.wsServerForControll.on('request', (function(_this){
            return function(request){

            //One TCP Server for each client WS Request
            request.tcpServer = new net.createServer();
            let uri = url.parse(request.httpRequest.url, true);
            if (uri.query.dst != undefined){
                //One TCP Server for each client WS Request
                request.tcpServer = new net.createServer();

                let remoteAddr = uri.query.dst;
                let portTcp;
                let ref1 = remoteAddr.split(":");
                portTcp = ref1[1];

                request.tcpServer.listen(portTcp);
                logger('[wst_server_reverse.start]'+(new Date())+'Created TCP server on port: '+portTcp);
                request.wsConnectionForControll = request.accept('tunnel-protocol', request.origin);


                logger('[wst_server_reverse.start]'+(new Date())+'WS Connection for Control Created');

                request.wsConnectionForControll.on('close', function(reasonCode, description) {
                    logger('[wst_server_reverse.start]'+(new Date())+ 'WebSocket Control Peer '+
                        request.wsConnectionForControll.remoteAddress+
                        ' disconnected for:"'+description+'"');
                    logger('[wst_server_reverse.start]'+(new Date())+'Close TCP server on port '+portTcp);

                    request.tcpServer.close();
                });
            }
            //REQUEST FOR WS SOCKET USED FOR DATA
            else{
                logger('[wst_server_reverse.start]'+(new Date())+'Request for Data WS Socket');
                newWSTCP_DATA.emit('created', request);
            }

            //Manage TCP Connection
            request.tcpServer.on('connection', (function(_this){
                return function(tcpConn){
                    tcpConn.wsConnection;
                    //Putting in pause the tcp connection waiting the new socket WS Socket for data
                    tcpConn.pause();
                    let idConnection = nextConnectionIntId();
                    let msgForNewConnection = "NC:"+idConnection;
                    request.wsConnectionForControll.sendUTF(msgForNewConnection);
                    newWSTCP_DATA.on('created',(function(_this){
                        return function(request){
                            let uri = url.parse(request.httpRequest.url, true);
                            if(idConnection == uri.query.id){
                                tcpConn.wsConnection = request.accept('tunnel-protocol', request.origin);
                                let myBind = new BindSocketsReverse(tcpConn.wsConnection,tcpConn);
                                myBind.start();
                                //Resuming of the tcp connection after WS Socket is just created
                                tcpConn.resume();
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
