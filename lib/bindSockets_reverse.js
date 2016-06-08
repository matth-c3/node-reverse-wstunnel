'use strict'

//###############################################################################
//##
//# Copyright (C) 2014-2015 Andrea Rocco Lotronto
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

/*
module.exports = {
  bindSockets : function(wsc,tcpc){
    bindSocketsFunction(wsc,tcpc)
  }
}
*/

class bindSockets{
  constructor(wsP,tcpP){
    this.wsconn = wsP;
    this.tcpconn = tcpP;
  }
  
  start(){
    this.wsconn.__paused = false;
    
    this.wsconn.on('message', function(message) {
      
      if (message.type === 'utf8') {
        return console.log('Error, Not supposed to received message ');
      } 
      else if (message.type === 'binary') {
        if (false === this.tcpconn.write(message.binaryData)) {
          this.wsconn.socket.pause();
          this.wsconn.__paused = true;
          //DEBUG MESSAGE FOR TESTING
          //console.log('WS message pause true');
          return "";
        } 
        else {
          if (true === this.wsconn.__paused) {
            this.wsconn.socket.resume();
            //DEBUG MESSAGE FOR TESTING
            //console.log('WS message pause false');
            return this.wsconn.__paused = false;
          }
        }
      }
    }.bind(this));
  
    this.tcpconn.on("drain", function() {
      this.wsconn.socket.resume();
      //DEBUG MESSAGE FOR TESTING
      //console.log('WS resume');
      return this.wsconn.__paused = false;
    }.bind(this));
    
    this.wsconn.on("overflow", function() {
      //DEBUG MESSAGE FOR TESTING
      //console.log('TCP pause');
      return this.tcpconn.pause();
    }.bind(this));
    
    this.wsconn.socket.on("drain", function() {
      //DEBUG MESSAGE FOR TESTING
      //console.log('WS message pause false');
      return this.tcpconn.resume();
    }.bind(this));
    
    this.tcpconn.on("data", function(buffer) {
      //DEBUG MESSAGE FOR TESTING
      //console.log((new Date()) + 'TCP DATA ');
      return this.wsconn.sendBytes(buffer);
    }.bind(this));
    
    this.wsconn.on("error", function(err) {
      return console.log((new Date()) + 'ws Error ' + err);
    }.bind(this));
    
    this.tcpconn.on("error", function(err) {
      console.log((new Date()) + 'tcp Error ' + err);
      return this.tcpconn.destroy();
    }.bind(this));
    
    this.wsconn.on('close', function(reasonCode, description) {
      console.log((new Date()) + 'WebSocket Peer ' + this.wsconn.remoteAddress + ' disconnected for:\"'+description+'\"');
      return this.tcpconn.destroy();
    }.bind(this));
    
    this.tcpconn.on("close", function() {
      //DEBUG MESSAGE FOR TESTING
      console.log((new Date()) + 'TCP connection Close');
      //return tcpconn.destroy();//  
      return this.wsconn.close();
    }.bind(this));

  }
}

module.exports = bindSockets;

/*
function bindSocketsFunction(wsconn, tcpconn) {
  wsconn.__paused = false;
  wsconn.on('message', function(message) {
    
    if (message.type === 'utf8') {
      return console.log('Error, Not supposed to received message ');
    } 
    else if (message.type === 'binary') {
      if (false === tcpconn.write(message.binaryData)) {
        wsconn.socket.pause();
        wsconn.__paused = true;
        //DEBUG MESSAGE FOR TESTING
        //console.log('WS message pause true');
        return "";
      } 
      else {
        if (true === wsconn.__paused) {
          wsconn.socket.resume();
          //DEBUG MESSAGE FOR TESTING
          //console.log('WS message pause false');
          return wsconn.__paused = false;
        }
      }
    }
  });

  tcpconn.on("drain", function() {
    wsconn.socket.resume();
    //DEBUG MESSAGE FOR TESTING
    //console.log('WS resume');
    return wsconn.__paused = false;
  });
  
  wsconn.on("overflow", function() {
    //DEBUG MESSAGE FOR TESTING
    //console.log('TCP pause');
    return tcpconn.pause();
  });
  
  wsconn.socket.on("drain", function() {
    //DEBUG MESSAGE FOR TESTING
    //console.log('WS message pause false');
    return tcpconn.resume();
  });
  
  tcpconn.on("data", function(buffer) {
    //DEBUG MESSAGE FOR TESTING
    //console.log((new Date()) + 'TCP DATA ');
    return wsconn.sendBytes(buffer);
  });
  
  wsconn.on("error", function(err) {
    return console.log((new Date()) + 'ws Error ' + err);
  });
  
  tcpconn.on("error", function(err) {
    console.log((new Date()) + 'tcp Error ' + err);
    return tcpconn.destroy();
  });
  
  wsconn.on('close', function(reasonCode, description) {
    console.log((new Date()) + 'WebSocket Peer ' + wsconn.remoteAddress + ' disconnected for:\"'+description+'\"');
    return tcpconn.destroy();
  });
  
  tcpconn.on("close", function() {
    //DEBUG MESSAGE FOR TESTING
    console.log((new Date()) + 'TCP connection Close');
    //return tcpconn.destroy();//  
    return wsconn.close();
  });

}

*/