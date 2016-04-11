"use strict";

//REQUIRE LIBRARY
const wst = require("../lib/wst_server_reverse.js")

//INSTANCE A NEW WEBSOCKET TUNNEL REVERSE SERVER OBJECT
//IN THE NEW VERSION YOU NEED TO SPECIFY THE PORT AT DEFINITION
//TIME
let server = new wst(8888);

//STARTS THE SERVER ON THE PORT 8888
server.start();