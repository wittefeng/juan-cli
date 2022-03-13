'use strict'

const Command = require('@juan-cli/command')

class InitCommand extends Command {}

function init(argv) {
  // console.log('init', projectName, cmdObj.force, process.env.CLI_TARGET_PATH)
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
