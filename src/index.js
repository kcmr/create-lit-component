const {Command, flags} = require('@oclif/command')
const {prompt} = require('enquirer')

class CreateLitComponentCommand extends Command {
  async run() {
    const {flags} = this.parse(CreateLitComponentCommand)
    const paramNotInFlags = entry => !Object.keys(flags).includes(entry.name)
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
      },
    ].filter(paramNotInFlags)

    let responses = {}
    if (questions.length > 0) {
      responses = await prompt(questions)
    }
    const options = Object.assign(flags, responses)

    this.log(options)
  }
}

CreateLitComponentCommand.description = `Describe the command here
...
Extra documentation goes here
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
