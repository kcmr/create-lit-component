const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1)
const camelCase = string => string.replace(/[-_]./g, match => match.charAt(1).toUpperCase())
const titleCase = string => capitalize(camelCase(string))

module.exports = {capitalize, camelCase, titleCase}
