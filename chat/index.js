const kappa = require('kappa-core')

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

module.exports = function (storage) {
  return kappa(storage, { valueEncoding: json })
}


