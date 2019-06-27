const Discovery = require('discovery-swarm')
const kappa = require('kappa-core')
const View = require('kappa-view-list')
const memdb = require('memdb')
const level = require('level')
const pump = require('pump')
const path = require('path')
const mkdirp = require('mkdirp')
const pull = require('pull-stream')
const MFR = require('map-filter-reduce')
const stream = require('stream')
const toPull = require('stream-to-pull-stream')

const APP_PATH = `./kappa-chat-${process.argv[2]}`
const DISCOVERY_KEY = 'kappa-chat'
const TIMESTAMPS = 't'

const swarm = Discovery()
mkdirp.sync(`${APP_PATH}/views`)
const db = level(path.join(APP_PATH, 'views'))

var json = {
  encode: function (obj) {
    return Buffer.from(JSON.stringify(obj))
  },
  decode: function (buf) {
    var str = buf.toString('utf8')
    try { var obj = JSON.parse(str)  } catch (err) { return {}  }
    return obj
  }
}

const core = kappa(APP_PATH, { valueEncoding: json })

const view = View(db, (msg, next) => {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'number') next(null, [msg.value.timestamp])
  else next()
})

swarm.join(DISCOVERY_KEY)

core.use('timestamp', view)

console.log(core.api.timestamp.read())

core.ready(function () {
  // console.log(core.feeds().map(f => f.key.toString('hex')))
  // core.api.timestamp.tail(10, (msgs) => {
  //   console.log(msgs)
  // })
  // pump(
  //   core.api.timestamp.read,
  //   MFR([
  //     { $filter: { value: { type: 'chat/message' } }}
  //   ]),
  //   new stream.Writable({
  //     write: function(chunk, encoding, next) {
  //       console.log(chunk.toString());
  //       next()
  //     }
  //   })
  // )
  // pump(
  // // pull(
  //   db.createReadStream({ live: true }),
  //   db.createReadStream({ live: true }),
  // //   core.api.timestamp.read(),
  //   // MFR([
  //   //   { $filter: { value: { type: 'chat/message' } }}
  //   // ]),
  //   // pull.drain(console.log)
  // //   pull.take(1),
  //   pull.collect((err, msgs) => {
  //     console.log(msgs)
  //   })
  // )

  pull(
    toPull(core.api.timestamp.read({ live: true })),
    MFR([
      { $filter: { value: { timestamp: 1561560076601 } } }
    ]),
    pull.drain(console.log)
  )
  // db.createReadStream({ live: true }).on('data', (chunk) => {
  //   if (chunk.key === 'state') {
  //     console.log(Buffer.from(chunk.value).toString('utf8'))
  //   }
  // })

  // core.feed('local', (err, feed) => {
  //   prompt('Send a message: \n', process.exit)

  //   function prompt(question, callback) {
  //     var stdin = process.stdin,
  //       stdout = process.stdout

  //     stdin.resume()
  //     stdout.write(question)

  //     // stdin.on('data', function (data) {
  //     //   feed.append({
  //     //     type: 'chat/message',
  //     //     body: data.toString(),
  //     //     timestamp: Date.now()
  //     //   })
  //     // })
  //   }
  // })

  swarm.on('connection', (connection, info) => {
    console.log(info)
    pump(connection, core.replicate({ live: true  }), connection)
  })
})

