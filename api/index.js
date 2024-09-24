// const app = require("./server")
const app = require("./proxy-server")

module.exports = (req, res) => {
  app(req, res)
}
