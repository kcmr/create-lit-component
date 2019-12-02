import { fixture, fixtureCleanup, html, assert } from '@open-wc/testing';
import '../{{component}}.js';

suite('<{{component}}>', () => {
  test('"myProperty" can be set via "my-property" attribute', async() => {
    const el = await html`<{{component}} my-property="foo"></{{component}}>`;

    assert.strictEqual(el.myProperty, 'foo');
  });
});
