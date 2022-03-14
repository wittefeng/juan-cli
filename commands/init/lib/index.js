'use strict'

const fs = require('fs')
const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')
const log = require('@juan-cli/log')
const Command = require('@juan-cli/command')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
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
        this.downloadTemplate(projectInfo)
        // 3. 安装模版
      }
    } catch (error) {
      log.error(error.message)
    }
  }

  // 1. 准备阶段
  async prepare() {
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

  // 2. 下载模版
  async downloadTemplate(projectInfo) {
    // 1. 通过项目模版API获取项目模版信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模版
    // 1.3 将项目模版信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并且通过API返回
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
