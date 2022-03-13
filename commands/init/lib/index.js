'use strict'

const log = require('@juan-cli/log')
const Command = require('@juan-cli/command')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName:', this.projectName)
    log.verbose('force:', this.force)
  }
  exec() {
    console.log('init command exec')
  }
}

function init(argv) {
  // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
