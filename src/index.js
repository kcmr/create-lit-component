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
const parseScope = value => value.charAt(0) === '@' ? value : `@${value}`

class CreateLitComponentCommand extends Command {
  constructor() {
    super(...arguments)
    this.name = 'lit-component'
    this.userPrefs = new Conf({projectName: this.name})
    this.templatesDir = path.join(__dirname, '..', 'templates')
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
        default: userPrefs.useScope,
      },
      {
        type: 'input',
        name: 'scope',
        message: 'Scope for the npm package',
        default: userPrefs.scope,
        when: answers => answers.useScope,
        transformer: input => parseScope(input),
      },
      {
        type: 'input',
        name: 'description',
        message: 'Component description',
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

  saveUserPreferences({scope}) {
    if (scope) {
      this.userPrefs.set(`${this.name}.scope`, parseScope(scope))
    }

    this.userPrefs.set(`${this.name}.useScope`, Boolean(scope))
  }

  async writeComponent(options) {
    const srcDir = this.templatesDir
    const destDir = path.join(process.cwd(), options.name)

    const component = options.name
    const description = options.description
    const pkgName = options.scope ? `${parseScope(options.scope)}/${component}` : component
    const componentClassName = titleCase(component)
    const templateVars = {component, description, pkgName, componentClassName}
    const output = await copy(srcDir, destDir, templateVars)

    // delete .git file (git submodule)
    const [dotGitFile] = output.filter(file => file.endsWith('.git'))
    await unlink(dotGitFile)

    this.afterWrite(options, destDir)
  }

  afterWrite(options, destDir) {
    if (!options.install) {
      this.log(`\n👍 Component created in ${options.name}!\n`)
      this.log('Don\'t forget to install dependencies before running "npm start"\n')
      return
    }

    const subprocess = execa('npm', ['i'], {
      cwd: destDir,
      stdio: options.silent ? 'pipe' : 'inherit',
    })

    if (options.silent) {
      cli.action.start('Installing dependencies')
    } else {
      this.log('\nInstalling dependencies\n')
    }

    subprocess.on('close', () => {
      cli.action.stop()
      this.log(`\n👍 Component created in ${options.name}!\n`)
      this.log(`Run "npm start" from ${options.name} to start the dev server\n`)
    })
  }
}

CreateLitComponentCommand.description = `LitElement component generator
...
Creates a LitElement Web Component using some @open-wc recommendations and Parcel bundler for the dev server (demo).
All of the flags are optional. You will be prompted for the required params.
Run it with "--no-install" boolean flag to skip dependency installation.
`

CreateLitComponentCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),

  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),

  scope: flags.string({
    char: 's',
    description: 'scope for the npm package',
  }),

  name: flags.string({
    char: 'n',
    description: 'component name',
  }),

  description: flags.string({
    char: 'd',
    description: 'component description',
  }),

  install: flags.boolean({
    char: 'i',
    description: 'install dependencies',
    default: true,
    allowNo: true,
  }),

  silent: flags.boolean({
    description: 'silent dependency installation',
    default: false,
  }),
}

module.exports = CreateLitComponentCommand
