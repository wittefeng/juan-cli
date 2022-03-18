'use strict'

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')
const userHome = require('user-home')
const ejs = require('ejs')
const log = require('@juan-cli/log')
const Command = require('@juan-cli/command')
const getProjectTemplate = require('./getProjectTemplate')
const Package = require('@juan-cli/package')

const { spinnerStart, sleep, execAsync } = require('@juan-cli/utils')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TYPE_TEMPLATE_NORMAL = 'normal'
const TYPE_TEMPLATE_CUSTOM = 'custom'

const WHITE_COMMAND = ['npm', 'cnpm']
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName:', this.projectName)
    log.verbose('force:', this.force)
  }
  async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        // 2. 下载模版
        log.verbose('projectInfo', projectInfo)
        this.projectInfo = projectInfo
        await this.downloadTemplate()
        // 3. 安装模版
        await this.installTemplate()
      }
    } catch (error) {
      log.error(error.message)
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(error)
      }
    }
  }

  // 1. 准备阶段
  async prepare() {
    // 0. 提前判断项目模版是否存在
    const template = await getProjectTemplate()
    if (!template || template.length === 0) {
      throw new Error('项目模版不存在')
    }
    this.template = template

    const localPath = process.cwd()
    // 1. 判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      // 1.1 询问是否继续创建
      let ifContinue = false
      if (!this.force) {
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            default: false,
            name: 'ifContinue',
            message: '当前文件夹不为空，是否继续创建项目？'
          })
        ).ifContinue
        if (!ifContinue) {
          console.log('')
          return
        }
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 给用户二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          default: false,
          name: 'confirmDelete',
          message: '是否确认清空当前目录下的文件？'
        })
        if (confirmDelete) {
          // 清空当前目录
          fsExtra.emptyDirSync(localPath)
        } else {
          return
        }
      }
    }
    return this.getProjectInfo()
  }

  async getProjectInfo() {
    let projectInfo = {}
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJECT
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    log.verbose('type', type)
    if (type === TYPE_PROJECT) {
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: '',
          validate: function (v) {
            var done = this.async()

            // 1. 首字符必须为英文字符
            // 2. 尾字符必须为英文或数字，不能为字符
            // 3. 字符仅允许"-_"
            // 合法： a, a-b, a_b, a-b-c, a_b_c, a-b1-c1, a_b1_c1
            // 不合法：1, a_, a-
            setTimeout(function () {
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                  v
                )
              ) {
                done('请输入合法的项目名称')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (v) {
            return v
          }
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '1.0.0',
          validate: function (v) {
            var done = this.async()
            setTimeout(function () {
              if (!!!semver.valid(v)) {
                done('请输入合法的项目名版本号')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (v) {
            if (!!semver.valid(v)) {
              return semver.valid(v)
            } else {
              return v
            }
          }
        },
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模版',
          choices: this.createTemplate()
        }
      ])
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {
      // 2. 获取组件的基本信息
    }
    // return 项目的基本信息(object)
    // 生成className 驼峰命名改为-形式
    if (projectInfo.projectName) {
      projectInfo.className = require('kebab-case')(
        projectInfo.projectName
      ).replace(/^-/, '')
    }
    return projectInfo
  }

  isDirEmpty(localPath) {
    const fileList = fs.readdirSync(localPath)
    // TODO 文件过滤逻辑
    const fl = fileList.filter(
      (file) => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    )
    return !fl || fl.length <= 0
  }

  // 返回符合inquirer格式
  createTemplate() {
    return this.template.map((item) => ({
      value: item.npmName,
      name: item.name
    }))
  }

  // 2. 下载模版
  async downloadTemplate() {
    // 1. 通过项目模版API获取项目模版信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模版
    // 1.3 将项目模版信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并且通过API返回
    const { projectTemplate } = this.projectInfo
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    )
    const targetPath = path.resolve(userHome, '.juan-cli', 'template')
    const storePath = path.resolve(
      userHome,
      '.juan-cli',
      'template',
      'node_modules'
    )
    const templateNpm = new Package({
      targetPath,
      storePath,
      packageName: templateInfo.npmName,
      packageVersion: templateInfo.version
    })
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart('正在下载模版...')
      await sleep()
      try {
        await templateNpm.install()
        spinner.succeed('下载模版成功')
        this.templateNpm = templateNpm
      } catch (error) {
        spinner.warn(error)
        return
      }
    } else {
      const spinner = spinnerStart('正在更新模版...')
      await sleep()
      try {
        await templateNpm.update()
        spinner.succeed('更新模版成功')
        this.templateNpm = templateNpm
      } catch (error) {
        spinner.warn(error)
        return
      }
    }
    this.templateInfo = templateInfo
  }

  // 3. 安装模版
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TYPE_TEMPLATE_NORMAL
      }
      if (this.templateInfo.type === TYPE_TEMPLATE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate()
      } else if (this.templateInfo.type === TYPE_TEMPLATE_CUSTOM) {
        // 自定义安装
        await this.installCustomTemplate()
      } else {
        throw new Error('无法识别项目模版类型！')
      }
    } else {
      throw new Error('项目模版信息不存在')
    }
  }

  async installNormalTemplate() {
    log.verbose('templateInfo', this.templateInfo)
    const spinner = spinnerStart('正在安装模版...')
    // 拷贝模版代码至当前目录
    try {
      const templatePath = path.resolve(
        this.templateNpm.cacheFilePath,
        'template'
      )
      const targetPath = process.cwd()
      fsExtra.ensureDirSync(templatePath)
      fsExtra.ensureDirSync(targetPath)
      fsExtra.copySync(templatePath, targetPath)
      spinner.succeed('安装模版成功')
    } catch (error) {
      spinner.warn(error)
    }
    // 写在外面，为了日志能打印出来
    const ignore = ['node_modules/**', 'public/index.html']
    await this.ejsRender({ ignore })
    // 依赖安装
    const { installCommand, startCommand } = this.templateInfo
    spinner.info('开始安装依赖')
    let installRet = await this.execCommand(installCommand)
    log.verbose('installRet', installRet)
    if (installRet !== 0) {
      spinner.warn('依赖在安装过程中失败！')
    } else {
      spinner.succeed('依赖安装完成,准备启动项目')
    }
    // 启动命令执行
    await this.execCommand(startCommand)
    if (installRet !== 0) {
      spinner.warn('项目启动失败！')
    }
  }
  async installCustomTemplate() {
    console.log('自定义模版')
  }
  async execCommand(command) {
    let ret
    if (command) {
      const commandArray = command.split(' ')
      const cmd = this.checkCommand(commandArray[0])
      if (!cmd) {
        throw new Error(`命令：${commandArray[0]} 不存在`)
      }
      const args = commandArray.slice(1)
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cmd: process.cwd()
      })
    }
    return ret
  }
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd
    } else {
      return null
    }
  }

  async ejsRender(options) {
    const dir = process.cwd()
    return new Promise((resolve, reject) => {
      require('glob')(
        '**',
        {
          cwd: dir,
          ignore: options.ignore || '',
          nodir: true
        },
        (err, files) => {
          if (err) {
            reject(err)
          }
          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file)
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(
                  filePath,
                  {
                    ...this.projectInfo,
                    version: this.projectInfo.projectVersion
                  },
                  {},
                  (err, result) => {
                    console.log(err, result)
                    if (err) {
                      reject1(err)
                    } else {
                      fsExtra.writeFileSync(filePath, result)
                      resolve1(result)
                    }
                  }
                )
              })
            })
          )
            .then(() => resolve())
            .catch((err) => reject(err))
        }
      )
    })
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
