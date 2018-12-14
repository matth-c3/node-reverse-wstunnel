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
const BindSockets = require('./bindSockets_reverse');
const logger = require('debug')('WstClientReverse');

class WstClientReverse {
  constructor() {
    this.wsClientForControll = new WebSocketClient();
  }

  start(portForTunnel, hostWSWithPort, addressToTunnelled) {
    //Getting paramiter
    let url = require('url');
    let urlWsHostObj = url.parse(hostWSWithPort);
    let _ref1 = addressToTunnelled.split(':');
    let remoteHost = _ref1[0];
    let remotePort = _ref1[1];

    //QUERY STRING IS CREATED TO REALIZE A NEW CONNECTION
    const wsUrl = `${hostWSWithPort}/?dst=${urlWsHostObj.hostname}:${portForTunnel}`;

    //Connection to Controll WS Server
    this.wsClientForControll.connect(wsUrl, 'tunnel-protocol');
    this.wsClientForControll.on('connect', (function(_this) {
      return function(wsConnectionForControll) {
        logger(`wsClientForControll for  Controll connected`);

        wsConnectionForControll.on('message', function(message) {

          logger(`Message for new TCP Connection on WS Server: ${message.utf8Data}`);
          let parsing = message.utf8Data.split(':');

          // Managing new TCP connection on WS Server
          if (parsing[0] === 'NC'){
            // Identification of ID connection
            let idConnection = parsing[1];
            this.wsClientData = new WebSocketClient();
            this.wsClientData.connect(`${hostWSWithPort}/?id=${idConnection}`, 'tunnel-protocol');
            logger(`Call WS-Server for connect id: ${parsing[1]}`);
            // Management of new WS Client for every TCP connection on WS Server
            this.wsClientData.on('connect', (function(){
              return function(wsConnectionForData){
                //Waiting of WS Socket with WS Server
                wsConnectionForData.socket.pause();
                logger(`WebSocket Paused`);
                logger(`Connected wsClientData to WS-Server for id: ${parsing[1]} on localport: ${wsConnectionForData.socket.localPort}`);
                logger(`Start PIPE wsConnectionForData TCP client to :${remoteHost}:${remotePort}`);
                tcpConnection(wsConnectionForData,remoteHost,remotePort);
              }
            })(this));
          }
        }
      );
    }
  })(this));

  // Management of WS Connection failed
  this.wsClientForControll.on('connectFailed', function(error) {
    logger(`WS connect error: ${error.toString()}`);
  }.bind(this));
  }
}


function tcpConnection(wsConn,host,port){
  let tcpConn = net.connect({ port, host }, function(){});

  tcpConn.on('connect',function(){
    let myBind = new BindSockets(wsConn,tcpConn);
    myBind.start();

    // Resume of the WS Socket after the connection to WS Server
    wsConn.socket.resume();
  });

  tcpConn.on('error',(function(_this){
    return function(request){

      logger(request);
    }
  })(this));

}

module.exports = WstClientReverse;
