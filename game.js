const kappa = require('kappa-core')
const View = require('kappa-view-list')
const memdb = require('memdb')
const neatLog = require('neat-log')
const blit = require('txt-blit')

const db = memdb()

const termWidth = process.stdout.columns
const termHeight = process.stdout.rows

const core = kappa('./kappa-chat', { valueEncoding: 'json' })

core.use('timestamp', View(db, (msg, next) => {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'number') next(null, [msg.value.timestamp])
  else next()
}))

const neat = neatLog(view, { fullscreen: true  })
neat.use(mainloop)

function mainloop (state, bus) {
  core.api.timestamp.tail(9, (msgs) => {
    state.msgs = msgs
    bus.emit('render')
  })
}

function drawFilledBox (w, h, msgs) {
  var border = new Array(w).fill('#').join('')
  var area = msgs.map((msg) => msg.value.body).join('')
  var box = []
  box.push(border)
  new Array(4).fill('#').forEach((_) => box.push(area))
  box.push(border)
  return box
}

function view (state) {
  var screen = []

  var w = Math.floor(termWidth / 2)
  var h = Math.floor(termHeight / 2)

  blit(screen, drawFilledBox(w, h, state.msgs), 0, 0)

  return screen.join('\n')
}

// prompt('Send a message: \n', process.exit)

// function prompt(question, callback) {
//   var stdin = process.stdin,
//     stdout = process.stdout

//   stdin.resume()
//   stdout.write(question)

//   stdin.on('data', function (data) {
//     feed.append({
//       type: 'chat/message',
//       body: data.toString(),
//       timestamp: Date.now()
//     })
//   })
// }
