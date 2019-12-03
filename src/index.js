const {Command, flags} = require('@oclif/command')
const {prompt} = require('inquirer')
const {cosmiconfig} = require('cosmiconfig')
const Conf = require('conf')
const copyTemplateDir = require('copy-template-dir')
const execa = require('execa')
const {cli} = require('cli-ux')
const {titleCase} = require('./string-utils')
const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const elementNameValidator = require('validate-element-name')

const copy = promisify(copyTemplateDir)
const unlink = promisify(fs.unlink)

class CreateLitComponentCommand extends Command {
  constructor() {
    super(...arguments)
    this.name = 'lit-component'
    this.userPrefs = new Conf({projectName: this.name})
  }

  async run() {
    const params = await this.getParams()

    if (params.name) {
      this.exitOnInvalidName(params.name)
    }

    const options = await this.requestMissingParams(params)
    this.saveUserPreferences(options)

    await this.writeComponent(options)
  }

  async getParams() {
    // read config found in files (.*rc, package.json, etc.)
    const explorer = cosmiconfig(this.name)
    const configInFiles = await explorer.search(this.name)
    const localConfig = configInFiles ? configInFiles.config : {}

    // override local config with flags
    const {flags} = this.parse(CreateLitComponentCommand)
    return Object.assign(localConfig, flags)
  }

  exitOnInvalidName(name) {
    const validationResult = this.validateElementName(name)

    if (typeof validationResult === 'string') {
      this.error(`Invalid name flag: ${name}\n${validationResult}`)
    }
  }

  validateElementName(name) {
    const result = elementNameValidator(name)

    if (!result.isValid) {
      return result.message
    }

    return true
  }

  async requestMissingParams(params) {
    const userPrefs = this.getStoredPreferences()
    let answers = {}
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Component name',
        validate: this.validateElementName,
      },
      {
        type: 'confirm',
        name: 'useScope',
        message: 'Do you want to use a scope for the npm package?',
        default: false,
      },
      {
        type: 'input',
        name: 'scope',
        message: 'Scope for the npm package',
        default: userPrefs.scope,
        when: answers => answers.useScope,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Component description',
      },
      {
        type: 'confirm',
        name: 'install',
        message: 'Do you want to install dependencies?',
        default: true,
      },
    ]

    const notInParams = entry => !Object.keys(params).includes(entry.name)
    const missingParams = questions.filter(notInParams)

    if (missingParams.length > 0) {
      answers = await prompt(missingParams).catch(this.exit)
    }

    // mix the user answers with the params
    return Object.assign(params, answers)
  }

  getStoredPreferences() {
    return this.userPrefs.get(this.name) || {}
  }

  saveUserPreferences(options) {
    if (options.scope) {
      this.userPrefs.set(`${this.name}.scope`, options.scope)
    }
  }

  async writeComponent(options) {
    const templates = path.join(__dirname, '..', 'templates')
    const destDir = path.join(process.cwd(), options.name)

    const component = options.name
    const description = options.description
    const pkgName = options.scope ? `${options.scope}/${component}` : component
    const componentClassName = titleCase(component)
    const templateVars = {component, description, pkgName, componentClassName}
    const output = await copy(templates, destDir, templateVars)

    // delete .git file (git submodule)
    const [dotGitFile] = output.filter(file => file.endsWith('.git'))
    await unlink(dotGitFile)

    this.afterWrite(options, destDir)
  }

  afterWrite(options, destDir) {
    if (!options.install) {
      this.log(`\n👍 Component created in ${options.name}!\n`)
      this.log('Don\'t forget to install dependencies before launching its demo with "npm start"\n')
      return
    }

    const subprocess = execa('npm', ['i'], {cwd: destDir})
    cli.action.start('Installing dependencies')

    subprocess.on('close', () => {
      cli.action.stop()
      this.log(`\n👍 Component created in ${options.name}!\n`)
      this.log('Run "npm start" from your component to launch its demo\n')
    })
  }
}

CreateLitComponentCommand.description = `Creates a LitElement Web Component using @open-wc recommendations
...
This is an example for a CLI workshop
`

CreateLitComponentCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),

  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),

  scope: flags.string({
    char: 's',
    description: 'Scope for the npm package',
    parse: input => input.charAt(0) === '@' ? input : `@${input}`,
  }),

  name: flags.string({
    char: 'n',
    description: 'Component name',
  }),

  description: flags.string({
    char: 'd',
    description: 'Component description',
  }),

  install: flags.boolean({
    char: 'i',
    description: 'Install dependencies (true). Use --no-install to skip install',
    default: true,
    allowNo: true,
  }),
}

module.exports = CreateLitComponentCommand
