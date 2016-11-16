import { select } from 'd3-selection';
import 'd3-selection-multi';

export default class TableColumn {
  constructor() {
    this._root = select('body')
      .append('th')
      .remove()
      .styles({
        'border-bottom': '1px solid #CCC',
        'color': '#AAA',
        'font-weight': 'normal',
        'font-size': '0.9em',
        'line-height': '2em',
        'padding': '0 0 0 1em',
        'text-align': 'start',
        'text-transform': 'uppercase'
      });
  }

  destroy() {
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
