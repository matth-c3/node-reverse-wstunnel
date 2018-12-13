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

const logger = require("./wst_logger");

class BindSockets {

    constructor(wsconn, tcpconn){
        this.wsconn = wsconn;
        this.tcpconn = tcpconn;
    }

    start(){
        this.wsconn.__paused = false;

        this.wsconn.on('message', function(message) {
            if (message.type === 'utf8') {
                logger('Error, Not supposed to received message ');
                return;
            } else if (message.type === 'binary') {
                if (false === this.tcpconn.write(message.binaryData)) {
                    this.wsconn.socket.pause();
                    this.wsconn.__paused = true;
                    return "";
                } else {
                    if (true === this.wsconn.__paused) {
                        this.wsconn.socket.resume();
                        return this.wsconn.__paused = false;
                    }
                }
            }
        }.bind(this));

        this.tcpconn.on("drain", function() {
            this.wsconn.socket.resume();
            return this.wsconn.__paused = false;
        }.bind(this));
        this.tcpconn.on("data", function(buffer) {
            return this.wsconn.sendBytes(buffer);
        }.bind(this));
        this.tcpconn.on("error", function(err) {
            return logger((new Date()) + 'tcp Error ' + err);
        }.bind(this));
        this.tcpconn.on("close", function() {
            logger((new Date()) + 'tunnel disconnected.');
            return this.wsconn.close();
        }.bind(this));


        this.wsconn.on("overflow", function() {
            return this.tcpconn.pause();
        }.bind(this));
        this.wsconn.socket.on("drain", function() {
            return this.tcpconn.resume();
        }.bind(this));
        this.wsconn.on("error", function(err) {
            return logger((new Date()) + 'ws Error ' + err);
        }.bind(this));
        this.wsconn.on('close', function(reasonCode, description) {
            logger((new Date()) + 'ws Peer ' + this.wsconn.remoteAddress + ' disconnected for: '+description);
            return this.tcpconn.destroy();
        }.bind(this));
    }
}

module.exports = BindSockets;
