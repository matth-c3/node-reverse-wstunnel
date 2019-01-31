const net = require('net');
const buildUrl = require('build-url');
const simpleEncryptor = require('simple-encryptor');
const WebSocketClient = require('websocket').client;
const BindSocketsReverse = require('./bind-sockets');
const dayjs = require('dayjs');
const logger = require('debug')('WstClientReverse');

class WstClientReverse {
  constructor (secret) {
    this.secret = secret;
    this.wsClientForControl = new WebSocketClient();
  }

  start ({ port, tcpPort, address }) {
    // parse tunnel server url
    // HACK: a tricky way to told tcp module do not check certificate
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    // Forward localhost tcp connection to outside
    const remoteHost = '127.0.0.1';
    const remotePort = port;

    // QUERY STRING IS CREATED TO REALIZE A NEW CONNECTION
    const wsUrl = buildUrl(
      address,
      {
        queryParams: {
          dst: tcpPort || 'random',
        },
      },
    );

    // Connection to Control WS Server
    this.wsClientForControl.connect(wsUrl, 'tunnel-protocol');
    this.wsClientForControl.on('connect', ((_this) => {
      return (wsConnectionForControl) => {
        logger(`wsClientForControl for Control connected`);

        wsConnectionForControl.on('message', (message) => {
          logger(`Message for new TCP Connection on WS Server: ${message.utf8Data}`);
          const [tag, id] = message.utf8Data.split(':');

          // Managing new TCP connection on WS Server
          if (tag === 'NC') {
            const encryptor = simpleEncryptor(_this.secret);
            const wsUrlWithId = buildUrl(
              address,
              {
                queryParams: {
                  id,
                  token: encryptor.encrypt(dayjs().unix()),
                },
              },
            );

            // Identification of ID connection
            this.wsClientData = new WebSocketClient();
            this.wsClientData.connect(wsUrlWithId, 'tunnel-protocol');
            logger(`Call WS-Server for connect id: ${id}`);

            // Management of new WS Client for every TCP connection on WS Server
            this.wsClientData.on('connect', (wsConnectionForData) => {
              // Waiting of WS Socket with WS Server
              wsConnectionForData.socket.pause();

              // DEBUG: log message
              logger(`WebSocket Paused`);
              logger(`Connected wsClientData to WS-Server for id: ${id} on localport: ${wsConnectionForData.socket.localPort}`);
              logger(`Start PIPE wsConnectionForData TCP client to: ${remoteHost}:${remotePort}`);

              // create tcp connection
              tcpConnection(wsConnectionForData, remoteHost, remotePort);
            });
          }
        });
      };
    })(this));

    // Management of WS Connection failed
    this.wsClientForControl.on('connectFailed', (error) => {
      logger(`WS connect error: ${error.toString()}`);
    });
  }
}

function tcpConnection (ws, host, port) {
  const tcp = net.connect({ port, host }, () => {});
  const bind = new BindSocketsReverse(ws, tcp);

  // Start binding with tcp connection
  bind.start();

  tcp.on('connect', () => {
    // Resume of the WS Socket after the connection to WS Server
    ws.socket.resume();
  });

  tcp.on('error', logger);
}

module.exports = WstClientReverse;
