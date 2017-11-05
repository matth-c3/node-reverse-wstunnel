#!/usr/bin/env node

const wst = require("../lib/wst_wrapper").client;

let client = new wst;

wsTunnelServer = 'ws://localhost:8888';

client.start('5566', wsTunnelServer, 'localhost:50022')