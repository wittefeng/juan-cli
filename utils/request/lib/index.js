'use strict'

const axios = require('axios')

const BASE_URL = process.env.JUAN_CLI_SERVER_BASE_URL
  ? process.env.JUAN_CLI_SERVER_BASE_URL
  : 'http://juan-cli-server.fungwey.cn:7001'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

module.exports = request
