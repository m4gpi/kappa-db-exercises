const kappa = require('kappa-core')
const View = require('kappa-view-list')
const memdb = require('memdb')
const level = require('level')
// const sublevel = require('subleveldown')
const path = require('path')

const db = level(path.join('kappa-chat', 'views'))

// const db = memdb()

const core = kappa('./kappa-chat', { valueEncoding: 'json' })
const view = View(db, (msg, next) => {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'number') next(null, [msg.value.timestamp])
  else next()
})

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
})

