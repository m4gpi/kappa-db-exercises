const pull = require('pull-stream')
const level = require('level')
const yargs = require('yargs')
const Discovery = require('discovery-swarm')
const path = require('path')
const mkdirp = require('mkdirp')
const pump = require('pump')

const APP_PATH = `./db`
const DISCOVERY_KEY = 'db'

mkdirp.sync(`${APP_PATH}/views`)
const db = level(path.join(APP_PATH, 'views'))

const View = require('./view')
const Core = require('./')

const core = Core(APP_PATH)
const view = View(db)

core.use('query', view)

core.ready(() => CLI(core))

function CLI (core) {
  return yargs
    .command('swarm', 'Replicate messages with peers using the same discovery key', (argv) => {
      const swarm = Discovery()
      swarm.join(DISCOVERY_KEY)
      swarm.on('connection', (connection, peer) => {
        console.log(`Connected to ${peer.id.toString('hex')}`)
        pump(connection, core.replicate({ live: true  }), connection)
      })
    })
    .command('publish', 'Append a message to your feed | --type must be provided', (yargs) => {
      yargs
        .positional('type', {
          demandOption: true,
          type: 'string'
        })
        .positional('content', {
          demandOption: true,
          type: 'string'
        })
    }, (argv) => {
      const { type, content } = argv
      core.feed('local', (err, feed) => {
        feed.append({
          type,
          content,
          timestamp: Date.now()
        }, callback)
      })
    })
    .command('query', 'Query for messages by type', (yargs) => {
      yargs
        .positional('type', {
          demandOption: true,
          type: 'string'
        })
        .positional('feed', {
          demandOption: false,
          type: 'string'
        })
    }, (argv) => {
      var { type, feed } = argv
      var $filter = { value: { type } }
      if (feed) $filter = Object.assign($filter, { key: feed })

      pull(
        core.api.query.read({ query: [{ $filter }] }),
        pull.drain(console.log)
      )
    })
    .argv

  function callback (err, res) {
    if (err) throw err
    else console.log(res)
  }
}
