import { select } from 'd3-selection';
import { controlBar } from '@scola/d3-generic';
import 'd3-selection-multi';
import '@scola/d3-media';

export default class Table {
  constructor() {
    this._rootMedia = null;
    this._bodyMedia = null;

    this._columns = [];

    this._column = () => {};
    this._cell = (d) => d;

    this._enter = () => {};
    this._exit = () => {};

    this._root = select('body')
      .append('div')
      .remove()
      .classed('scola table', true)
      .styles({
        'padding-bottom': '3em'
      });

    this._table = this._root
      .append('table')
      .styles({
        'background': '#FFF',
        'border-collapse': 'collapse',
        'border-color': '#CCC',
        'border-style': 'solid',
        'border-width': '1px 0',
        'overflow': 'hidden',
        'width': '100%'
      });

    this._head = this._table
      .append('thead');

    this._headerRow = this._head
      .append('tr')
      .append('th')
      .style('padding', 0);

    this._columnRow = this._head
      .append('tr');

    this._foot = this._table
      .append('tfoot');

    this._footerRow = this._foot
      .append('tr')
      .append('td')
      .style('padding', 0);

    this._body = this._table
      .append('tbody');
  }

  destroy() {
    if (this._rootMedia) {
      this._rootMedia.destroy();
      this._rootMedia = null;
    }

    if (this._bodyMedia) {
      this._bodyMedia.destroy();
      this._bodyMedia = null;
    }

    this._root.remove();
    this._root = null;
  }

  root() {
    return this._root;
  }

  body() {
    return this._body;
  }

  footer(action) {
    if (typeof action === 'undefined') {
      return this._footer;
    }

    if (action === false) {
      this._footer.destroy();
      this._footer = null;

      return this;
    }

    this._footer = controlBar();

    this._footer.root()
      .classed('scola footer', true)
      .styles({
        'border-top': '1px solid #CCC'
      });

    this._footerRow.node()
      .appendChild(this._footer.root().node());

    return this;
  }

  header(action) {
    if (typeof action === 'undefined') {
      return this._header;
    }

    if (action === false) {
      this._header.destroy();
      this._header = null;

      return this;
    }

    this._header = controlBar();

    this._header.root()
      .classed('scola header', true)
      .styles({
        'border-bottom': '1px solid #CCC'
      });

    this._headerRow.node()
      .appendChild(this._header.root().node());

    return this;
  }

  column(columns, modifier) {
    this._columns = columns;
    this._column = modifier;

    this._headerRow.attr('colspan', columns.length);
    this._footerRow.attr('colspan', columns.length);

    return this;
  }

  cell(value) {
    this._cell = value;
    return this;
  }

  enter(value) {
    this._enter = value;
    return this;
  }

  exit(value) {
    this._exit = value;
    return this;
  }

  inset(width = '48em') {
    if (width === false) {
      this._rootMedia.destroy();
      this._rootMedia = null;

      this._bodyedia.destroy();
      this._bodyMedia = null;

      return this;
    }

    this._rootMedia = this._root
      .media(`(min-width: ${width})`)
      .styles({
        'padding-left': '1em',
        'padding-right': '1em'
      })
      .start();

    this._bodyMedia = this._table
      .media(`(min-width: ${width})`)
      .styles({
        'border-radius': '0.5em',
        'border-style': 'none',
        'overflow': 'hidden'
      })
      .start();

    return this;
  }

  message(text, modifier = () => {}) {
    const message = this._body
      .append('tr')
      .classed('scola message', true)
      .append('td')
      .attr('colspan', this._columns.length)
      .styles({
        'cursor': 'default',
        'padding': '1em',
        'text-align': 'center'
      })
      .text(text);

    modifier(message);
    return this;
  }

  render(data, key) {
    this._body
      .select('.scola.message')
      .remove();

    const column = this._columnRow
      .selectAll('th')
      .data(this._columns)
      .enter()
      .append('th')
      .styles({
        'border-bottom': '1px solid #CCC',
        'color': '#AAA',
        'font-weight': 'normal',
        'font-size': '0.9em',
        'padding': '0.5em 0 0.5em 1em',
        'text-align': 'start',
        'text-transform': 'uppercase',
        'vertical-align': 'center'
      });

    const row = this._body
      .selectAll('tr')
      .data(data, key);

    const cell = row.selectAll('td')
      .data(this._cell);

    const exit = row.exit();

    const enter = row
      .enter()
      .append('tr')
      .merge(row)
      .style('border-top', (datum, index) => {
        return index > 0 ? '1px solid #CCC' : null;
      })
      .selectAll('td')
      .data(this._cell)
      .enter()
      .append('td')
      .merge(cell)
      .styles({
        'line-height': '3em',
        'overflow': 'hidden',
        'padding': '0 0 0 1em',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap'
      });

    this._column(column);
    this._exit(exit);
    this._enter(enter);
  }
}
