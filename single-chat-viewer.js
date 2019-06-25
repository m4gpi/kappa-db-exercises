var discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var pump = require('pump')

var publicKey = process.argv[2]
if (!publicKey) throw new Error('Pass a public key for feed to replicate from')

var discoveryKey = process.argv[3]
if (!discoveryKey) throw new Error('Pass a discovery key to locate the peer for replication')

var feed = hypercore('./single-chat-viewer', publicKey, { valueEncoding: 'json' })

feed.createReadStream({ live: true })
  .on('data', function (data) {
    console.log(data)
  })

var swarm = discovery()

feed.ready(function () {
  swarm.join(discoveryKey)

  swarm.on('connection', function (connection) {
    pump(connection, feed.replicate({ live: true }), connection)
  })
})
