'use strict'

const path = require('path')
const fsExtra = require('fs-extra')
const pkgdir = require('pkg-dir').sync
const pathExists = require('path-exists').sync
const npminstall = require('npminstall')
const { isObject } = require('@juan-cli/utils')
const formatPath = require('@juan-cli/format-path')
const {
  getDefaultRegistry,
  getNpmLatestVersion
} = require('@juan-cli/get-npm-info')

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
    // package 的缓存路径
    this.storePath = options.storePath
    //   package 的name
    this.packageName = options.packageName
    //   package 的version
    this.packageVersion = options.packageVersion
    // package 的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  // 将 version = latest 转化为具体 version number
  async prepare() {
    if (this.storePath && !pathExists(this.storePath)) {
      fsExtra.mkdirpSync(this.storePath)
    }
    if (this.packageVersion === 'latest') {
      // npmName, registry
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }

  get cacheFilePath() {
    //  _@juan-cli_init@1.1.3@@juan-cli
    // @juan-cli
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    )
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    )
  }

  // 判断当前 Package 是否存在
  async exists() {
    // 判断文件属于缓存还是目标路径
    if (this.storePath) {
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  // 安装Package
  async install() {
    await this.prepare()
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion
        }
      ]
    })
  }

  // 更新Package
  async update() {
    await this.prepare()
    // 1. 判断是否是最新的
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    // 2. 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    // 3. 如果不存在，则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestPackageVersion
          }
        ]
      })
    } else {
    }
    this.packageVersion = latestPackageVersion
  }

  // 获取入口文件路径
  getRootFilePath() {
    if (this.storePath) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
    function _getRootFile(targetPath) {
      // 1. 获取 package.json 所在目录 - pkg-dir
      const dir = pkgdir(targetPath)
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
}

module.exports = Package
