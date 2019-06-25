var Discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var pump = require('pump')

var feed = hypercore('./single-chat', { valueEncoding: 'json' })
var swarm = Discovery()

feed.ready(function () {
  console.log("PUBLIC KEY: ", feed.key.toString('hex'))
  console.log("DISCOVERY KEY: ", feed.discoveryKey.toString('hex'))
  swarm.join(feed.discoveryKey.toString('hex'))

  swarm.on('connection', function (connection, info) {
    pump(connection, feed.replicate({ live: true }), connection)
  })
})

feed.createReadStream({ live: true }).on('data', console.log)

prompt('Whats your name?\n', process.exit)

function prompt(question, callback) {
  var stdin = process.stdin,
    stdout = process.stdout

  stdin.resume()
  stdout.write(question)

  stdin.on('data', function (data) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString().trim(),
      timestamp: new Date().toISOString()
    })
  })
}

