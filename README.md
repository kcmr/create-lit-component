# LitElement Web Component generator

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Parcel](https://img.shields.io/badge/bundler-Parcel-brightgreen.svg)](https://parceljs.org/)

A minimal scaffold generator for Web Components with LitElement.

```sh
$ npm init kcmr/lit-component
```

![CLI Screenshot](cli-screenshot.png)

Features:

- Uses [**Parcel** bundler](https://parceljs.org/) for the component's demo (dev server). **Super fast** build and reload!
- [@open-wc/testing](https://open-wc.org/testing/) for unit tests (TDD style)
- Allows to import the component class without element registration. Define the tag as you like

## Usage

Install it globally and run it:

```sh
$ npm i -g kcmr/lit-component
$ lit-component
```

Or run it directly without installation (get always the latest version from github):

```sh
$ npm init kcmr/lit-component
```

## Options

Component:
- `-n`, `--name` Component name
- `-d`, `--description` Component description (used in description field inside package.json)
- `-s`, `--scope` Optional package scope (`@my-company`)
- `-i`, `--[no-]install` Install dependencies (`true`). Use `--no-install` to skip dependency installation
- `--silent` Use silent dependency installation

CLI:
- `-h`, `--help` Shows the CLI help
- `-v`, `--version` Shows the CLI version

## Config files or key in `package.json`

The CLI will remember the choices of the last execution with your preferences about the package scope but you can also use configuration files or a specific property in a `package.json` file.

- `lit-component` property in a `package.json`
- `.lit-componentrc` (JSON or YAML format)
- `.lit-componentrc.json`
- `.lit-componentrc.yaml`, `.lit-componentrc.yml`
- `.lit-componentrc.js`
- `lit-component.config.js`

Example config:

```json
{
  "scope": "@my-company",
  "description": "An awesome component",
  "install": false
}
```




