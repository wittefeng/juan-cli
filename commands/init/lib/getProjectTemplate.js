const request = require('@juan-cli/request')

module.exports = function () {
  return request({
    url: 'project/template'
  })
}
