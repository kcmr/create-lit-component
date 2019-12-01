const {Command, flags} = require('@oclif/command')
const {prompt} = require('enquirer')
const {cosmiconfig} = require('cosmiconfig')
const explorer = cosmiconfig('lit-component')
const Conf = require('conf')

class CreateLitComponentCommand extends Command {
  get name() {
    return 'lit-component'
  }

  async run() {
    // read config found in files (.*rc, package.json, etc.)
    const configInFiles = await explorer.search(this.name)
    const localConfig = configInFiles ? configInFiles.config : {}

    // override local config with flags (always have precedence)
    const {flags} = this.parse(CreateLitComponentCommand)
    const config = Object.assign(localConfig, flags)
    // this.log('config', config)

    // read config found in user preferences saved from previous executions
    const userPrefs = new Conf()
    const commandPrefs = userPrefs.get(this.name) || {}

    // check if we have all the required params
    const missingParams = entry => !Object.keys(config).includes(entry.name)
    const questions = [
      {
        type: 'input',
        name: 'name',
        message: 'Component name',
      },
      {
        type: 'input',
        name: 'scope',
        message: 'Scope for the npm package',
        default: commandPrefs.scope,
      },
    ].filter(missingParams)

    let responses = {}

    // if we have missing params, ask for them
    if (questions.length > 0) {
      responses = await prompt(questions)
    }

    // mix the user responses with the params
    const options = Object.assign(config, responses)

    // store the input for later usage
    userPrefs.set(`${this.name}.scope`, options.scope)

    this.log('config', options)

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
    required: false,
  }),

  name: flags.string({
    char: 'n',
    description: 'Component name',
  }),
}

module.exports = CreateLitComponentCommand
