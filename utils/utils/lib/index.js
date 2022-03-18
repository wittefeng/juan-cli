'use strict'

const isObject = require('./isObject')
const spinnerStart = require('./spinner')
const sleep = require('./sleep')
const { exec, execAsync } = require('./exec')

module.exports = { isObject, spinnerStart, sleep, exec, execAsync }
