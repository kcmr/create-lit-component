import { LitElement, html, css } from 'lit-element';

export class {{componentClassName}} extends LitElement {
  static get properties() {
    return {
      myProperty: {
        type: String,
        attribute: 'my-property'
      }
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  constructor() {
    super();
    this.myProperty = 'Ohh yeah!';
  }

  render() {
    return html`
      <p>${this.myProperty}</p>
    `;
  }
}
