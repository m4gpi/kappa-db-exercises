var neatLog = require('neat-log')
var blit = require('txt-blit')

var neat = neatLog(view, { fullscreen: true  })
neat.use(mainloop)

var termWidth = process.stdout.columns
var termHeight = process.stdout.rows

function view (state) {
  var screen = []

  var x = Math.floor(termWidth / 2)
  var y = Math.floor(termHeight / 2)
  blit(screen, drawFilledBox(x, y), 0, 0)

  return screen.join('\n')
}

function mainloop (state, bus) {
  setInterval(function () {
    bus.emit('render')
  }, 5)
}

function drawFilledBox (w, h) {
  var border = new Array(w).fill('#').join('')
  var area = new Array(w).fill('').map((s, i) => i === 0 || i === w - 1 ? '#' : ' ').join('')

  var box = []
  box.push(border)
  new Array(4).fill('#').forEach((_) => box.push(area))
  box.push(border)
  return box
}
