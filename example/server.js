#!/usr/bin/env node

const wst = require("../lib/wst_wrapper").server;

let server = new wst();

server.start(8888)