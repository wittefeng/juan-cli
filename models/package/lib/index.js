'use strict'

const { isObject } = require('@juan-cli/utils')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('The options cannot be empty. from @juan-cli/package')
    }
    if (!isObject(options)) {
      throw new Error('The options must be Object. from @juan-cli/package')
    }
    // package 的路径
    this.targetPath = options.targetPath
    //   package 的存储路径
    this.storePath = options.storePath
    //   package 的name
    this.packageName = options.packageName
    //   package 的version
    this.packageVersion = options.packageVersion
  }

  // 判断当前 Package 是否存在
  exists() {}

  // 安装Package
  install() {}

  // 更新Package
  update() {}

  // 获取入口文件路径
  getRootFilePath() {}
}

module.exports = Package
