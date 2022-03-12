'use strict'

const path = require('path')
const pkgdir = require('pkg-dir').sync
const { isObject } = require('@juan-cli/utils')
const formatPath = require('@juan-cli/format-path')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('The options cannot be empty. from @juan-cli/package')
    }
    if (!isObject(options)) {
      throw new Error('The options must be Object. from @juan-cli/package')
    }
    // package 的目标路径
    this.targetPath = options.targetPath
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
  getRootFilePath() {
    // 1. 获取 package.json 所在目录 - pkg-dir
    const dir = pkgdir(this.targetPath)
    if (dir) {
      // 2. 读取 package.json - require()
      const pkgFile = require(path.resolve(dir, 'package.json'))
      // 3. main / lib -> path
      if (pkgFile && pkgFile.main) {
        // 4. 路径的兼容(macOS/windows)
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
    return null
  }
}

module.exports = Package
