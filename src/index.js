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
  get name() {
    return 'lit-component'
  }

  async run() {
    // read config found in files (.*rc, package.json, etc.)
    const explorer = cosmiconfig(this.name)
    const configInFiles = await explorer.search(this.name)
    const localConfig = configInFiles ? configInFiles.config : {}

    // override local config with flags (always have precedence)
    const {flags} = this.parse(CreateLitComponentCommand)
    const config = Object.assign(localConfig, flags)

    const validateElementName = str => {
      const result = elementNameValidator(str)

      if (!result.isValid) {
        return result.message
      }

      return true
    }

    if (config.name) {
      const validationResult = validateElementName(config.name)

      if (typeof validationResult === 'string') {
        this.error(`Invalid name flag: ${config.name}\n${validationResult}`)
      }
    }

    // read config found in user preferences saved from previous executions
    const userPrefs = new Conf({projectName: this.name})
    const commandPrefs = userPrefs.get(this.name) || {}

    // check if we have all the required params
    const missingParams = entry => !Object.keys(config).includes(entry.name)
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Component name',
        validate: validateElementName,
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
        default: commandPrefs.scope,
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
    ].filter(missingParams)

    let answers = {}

    // if we have missing params, ask for them
    if (questions.length > 0) {
      answers = await prompt(questions).catch(this.exit)
    }

    // mix the user answers with the params
    const options = Object.assign(config, answers)

    // store the input for later usage
    if (options.scope) {
      userPrefs.set(`${this.name}.scope`, options.scope)
    }

    const templates = path.join(__dirname, '..', 'templates')
    const destDir = path.join(process.cwd(), options.name)

    const component = options.name
    const pkgName = options.scope ? `${options.scope}/${component}` : component
    const componentClassName = titleCase(component)

    const tplVars = {
      component: options.name,
      description: options.description,
      pkgName,
      componentClassName,
    }

    const output = await copy(templates, destDir, tplVars)
    // delete .git file (git submodule)
    const [dotGitFile] = output.filter(file => file.endsWith('.git'))
    await unlink(dotGitFile)

    const successMessage = () => this.log(`\n👍 Component created in ${options.name}!\n`)

    if (options.install) {
      const subprocess = execa('npm', ['i'], {cwd: destDir})
      cli.action.start('Installing dependencies')

      subprocess.on('close', () => {
        cli.action.stop()
        successMessage()
        this.log('Run "npm start" from your component to launch its demo\n')
      })
    } else {
      successMessage()
      this.log('Don\'t forget to install dependencies before launching its demo with "npm start"\n')
    }
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
}

module.exports = CreateLitComponentCommand
