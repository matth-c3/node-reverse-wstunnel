# Tunnel and Reverse Tunnel Client and Server implementation over WS/WSS protocol for Node.js
[![npm version](https://badge.fury.io/js/node-reverse-wstunnel.svg)](http://badge.fury.io/js/node-reverse-wstunnel)

[![NPM](https://nodei.co/npm/node-reverse-wstunnel.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/node-reverse-wstunnel/)

[![NPM](https://nodei.co/npm-dl/node-reverse-wstunnel.png?months=1&height=3)](https://nodei.co/npm/node-reverse-wstunnel/)



## Overview

Tools to establish a TCP socket tunnel over websocket connection, and to enstabilish a reverse tunnel over websocket connection, for circumventing the problems of direct connections to the host behind a strict firewalls or without a public IP.

## Installation
```JavaScript
npm install node-reverse-wstunnel
```
## Usage for a Node.js application
### Instantiation of a tunnel server
```JavaScript   
const wst = require("../lib/wst_wrapper").server;

//Instance of a new WebSocker Tunnel Server Object specifying the TCP port on which it will be listening
let server = new wst(8888);
//Start the server
server.start(port);
``` 
### Implementation of a tunnel client
```JavaScript   
const wst = require("../lib/wst_wrapper").client;

let client = new wst();

/*
<publicPortOnServer> is the port on the public reverse tunnel server on which the service will be reachable
<WSHost> is the remote host on which the reverse tunnel server is started  expressed in the following form 'ws://<hostname>:<port>'
<remoteHost>:<remotePort> is the end point of the service for the defined tunnel
*/
client.start('<publicPortOnServer>', '<WSHost>', '<remoteHost>:<remotePort>');

```

### Instantiation of a reverse tunnel server
```JavaScript   
const wst = require("../lib/wst_wrapper").server_reverse;

//Instance of a new WebSocker Reverse Tunnerl Server Object specifying the TCP port on which it will be listening
let server = new wst(8888);
//Start the server
server.start(port);
``` 
### Implementation of a reverse tunnel client
```JavaScript   
const wst = require("../lib/wst_wrapper").client_reverse;

let client = new wst();

/*
<publicPortOnServer> is the port on the public reverse tunnel server on which the service will be reachable
<WSHost> is the remote host on which the reverse tunnel server is started  expressed in the following form 'ws://<hostname>:<port>'
<remoteHost>:<remotePort> is the end point of the service for the defined tunnel
*/
client.start('<publicPortOnServer>', '<WSHost>', '<remoteHost>:<remotePort>');

```


### Usage of wst.js executable
Using the *wst.js* executable located in *bin* directory:

For running a websocket tunnel server:  

    ./wstt.js -s 8080


For running a websocket tunnel client: 

    ./wstt.js -tunnel 33:2.2.2.2:33 ws://host:8080

In the above example, client picks the final tunnel destination, similar to ssh tunnel.  Alternatively for security reason, you can lock tunnel destination on the server end, example:

**Server:**
        
        ./wstt.js -s 8080 -t 2.2.2.2:33

**Client:**
        
        ./wstt.js -t 33 ws://server:8080

In both examples, connection to localhost:33 on client will be tunneled to 2.2.2.2:33 on server via websocket connection in between.

For running a websocket reverse tunnel server:

    ./wstt.js -r -s 8080

For running a websocket reverse tunnel client:

    ./wstt.js -r 6666:2.2.2.2:33 ws://server:8080

In the above example the client tells the server to open a TCP server on port 6666 and all connection on this port are tunneled to the client that is directely connected to 2.2.2.2:33
