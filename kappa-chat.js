const Discovery = require('discovery-swarm')
const kappa = require('kappa-core')
const View = require('kappa-view-list')
const memdb = require('memdb')
const level = require('level')
const pump = require('pump')
const path = require('path')
// const sublevel = require('subleveldown')

const APP_PATH = `./kappa-chat-${process.argv[2]}`
const DISCOVERY_KEY = 'kappa-chat'

const swarm = Discovery()
const db = level(path.join(APP_PATH, 'views'))
// const db = memdb()

const core = kappa(APP_PATH, { valueEncoding: 'json' })

const view = View(db, (msg, next) => {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'number') next(null, [msg.value.timestamp])
  else next()
})

swarm.join(DISCOVERY_KEY)

core.use('timestamp', view)

core.ready(function () {
  core.api.timestamp.tail(10, (msgs) => {
    console.log(msgs)
  })

  core.feed('local', (err, feed) => {
    prompt('Send a message: \n', process.exit)

    function prompt(question, callback) {
      var stdin = process.stdin,
        stdout = process.stdout

      stdin.resume()
      stdout.write(question)

      stdin.on('data', function (data) {
        feed.append({
          type: 'chat/message',
          body: data.toString(),
          timestamp: Date.now()
        })
      })
    }
  })

  swarm.on('connection', (connection, info) => {
    console.log('new peer connected', info)
    pump(connection, core.replicate({ live: true  }), connection)
  })
})

