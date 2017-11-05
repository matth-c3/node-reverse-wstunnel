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


class bindSockets{
    constructor(wsP,tcpP){
        this.wsconn = wsP;
        this.tcpconn = tcpP;
    }
  
    start(){
        //Bind WS management Event
        this.wsconn.__paused = false;
    
        this.wsconn.on('message', function(message) {
      
            if (message.type === 'utf8') {
                console.log('bindSocket' + (new Date()) + ':\tError, text messages is not supported by Reverse WS-Tunnel ');
                return;
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

        this.wsconn.on("overflow", function() {
            console.log('[bindSocket]' + (new Date()) + ':\tTCP connection paused for WS OVERFLOW');
            return this.tcpconn.pause();
        }.bind(this));
    
        this.wsconn.socket.on("drain", function() {
            //DEBUG MESSAGE FOR TESTING
            //console.log('WS message pause false');
            return this.tcpconn.resume();
        }.bind(this));

        this.wsconn.on("error", function(err) {
            console.log('[bindSocket]' + (new Date()) + ':\tWebSocket Error ' + err);
        return;
        }.bind(this));

        this.wsconn.on('close', function(reasonCode, description) {
            console.log('[bindSockets]' + (new Date()) + ':\tWebSocket Peer ' + this.wsconn.remoteAddress + ' disconnected for:\"'+description+'\"');
            return this.tcpconn.destroy();
        }.bind(this));


        //Bind TCP management Event

        this.tcpconn.on("drain", function() {
            this.wsconn.socket.resume();
            console.log('[bindSocket]' + (new Date()) + ':\tWS resumed');
            return this.wsconn.__paused = false;
        }.bind(this));

        this.tcpconn.on("data", function(buffer) {
            console.log('[bindSockets]'+ (new Date()) + ':\tTCP DATA ');
            return this.wsconn.sendBytes(buffer);
        }.bind(this));

        this.tcpconn.on("error", function(err) {
            console.log('[bindSockets]'+ (new Date()) + ':\tTCP Error ' + err);
            return this.tcpconn.destroy();
        }.bind(this));

        this.tcpconn.on("close", function() {
            console.log('[bindSockets]'+ (new Date()) + ':\tTCP connection Close');
            return this.wsconn.close();
        }.bind(this));
    }
}

module.exports = bindSockets;