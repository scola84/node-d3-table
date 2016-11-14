import { select } from 'd3-selection';
import 'd3-selection-multi';

export default class TableMessage {
  constructor() {
    this._root = select('body')
      .append('td')
      .remove()
      .classed('scola message', true)
      .styles({
        'line-height': '3em',
        'text-align': 'center'
      });
  }

  destroy() {
    this._root.dispatch('destroy');
    this._root.remove();
    this._root = null;
  }

  root() {
    return this._root;
  }

  text(value) {
    this._root.text(value);
    return this;
  }
}
