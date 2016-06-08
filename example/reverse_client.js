"use strict";

//REQUIRE LIBRARY
const wst = require("../lib/wst").client_reverse;

let client = new wst();

client.start('8822', 'ws://127.0.0.1:8888', '127.0.0.1:22');