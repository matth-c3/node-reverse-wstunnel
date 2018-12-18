reverse-ws-tunnel
---

## Overview
`reverse-ws-tunnel` is modified version from `node-reverse-tunnel` and it only provides you reverse tunnel.

## Installation
```bash
yarn global add reverse-ws-tunnel
```

## Usage
### Server Side
```JavaScript
// create randome secret with crypto module
const crypto = require("crypto");
const secret = crypto.randomBytes(8).toString('hex');
const { ServerReverse } = require('reverse-ws-tunnel');

// create a new socket
const server = new ServerReverse(secret);

// start server at port 8000
server.start(8000);
```

### Client Side
```JavaScript
const { ClientReverse } = require('reverse-ws-tunnel');

// create a new socket client, secret is obtain from server
const client = new ClientReverse(secret);

// pipe port 3000 to remote server:8000 at port 8001
client.start(3000, 8001, 'http://remote:8000');
```
