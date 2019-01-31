reverse-websocket-tunnel
---

## Overview
`reverse-websocket-tunnel` is modified version from `node-reverse-tunnel` and it only provides you reverse tunnel.

## Installation
```bash
yarn add reverse-websocket-tunnel
```

## Usage
### Server Side
```JavaScript
// create randome secret with crypto module
const crypto = require('crypto');
const secret = crypto.randomBytes(8).toString('hex');
const { ServerReverse } = require('reverse-websocket-tunnel');

// create a new socket
const server = new ServerReverse(secret);

// start server at port 8000
server.start({ port: 8000 });
```

### Client Side
```JavaScript
const { ClientReverse } = require('reverse-websocket-tunnel');

// create a new socket client, secret is obtain from server
const client = new ClientReverse(secret);

// pipe port 3000 to remote remote:8000 at port 8001, make sure you listen on wss
client.start({ port: 3000, tcpPort: 8001, address: 'wss://remote:8000' });
```
