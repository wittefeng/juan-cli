'use strict'

const Package = require('@juan-cli/package')
const log = require('@juan-cli/log')

const SETTING = {
  init: '@juan-cli/init'
}

function exec() {
  const targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)

  const cmdObj = arguments[arguments.length - 1]
  const argsObj = arguments[arguments.length - 2]
  const cmdName = cmdObj.name()
  const packageName = SETTING[cmdName]
  const packageVersion = 'latest'

  const pkg = new Package({
    targetPath,
    storePath: '',
    packageName,
    packageVersion
  })
  console.log('pkg', pkg)
}
module.exports = exec
