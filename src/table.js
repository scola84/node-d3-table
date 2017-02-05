import { select } from 'd3-selection';
import isEqual from 'lodash-es/isEqual';
import { controlBar } from '@scola/d3-control';
import 'd3-selection-multi';
import '@scola/d3-media';

export default class Table {
  constructor() {
    this._cell = (d) => d;
    this._enter = () => {};
    this._exit = () => {};
    this._column = () => {};

    this._rootMedia = null;
    this._bodyMedia = null;

    this._header = null;
    this._footer = null;
    this._columns = [];
    this._message = null;

    this._data = null;
    this._key = null;

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
    this._deleteInset();
    this._deleteHeader();
    this._deleteFooter();
    this._deleteMessage();

    this._root.dispatch('destroy');
    this._root.remove();
    this._root = null;
  }

  root() {
    return this._root;
  }

  body() {
    return this._body;
  }

  cell(value = null) {
    if (value === null) {
      return this._cell;
    }

    this._cell = value;
    return this;
  }

  enter(value = null) {
    if (value === null) {
      return this._enter;
    }

    this._enter = value;
    return this;
  }

  exit(value = null) {
    if (value === null) {
      return this._exit;
    }

    this._exit = value;
    return this;
  }

  inset(width = '48em') {
    if (width === false) {
      return this._deleteInset();
    }

    if (!this._rootMedia) {
      this._insertInset(width);
    }

    return this;
  }

  header(action = true) {
    if (action === false) {
      return this._deleteHeader();
    }

    if (!this._header) {
      this._insertHeader();
    }

    return this._header;
  }

  footer(action = true) {
    if (action === false) {
      return this._deleteFooter();
    }

    if (!this._footer) {
      this._insertFooter();
    }

    return this._footer;
  }

  column(columns = null, modifier = null) {
    if (columns === null) {
      return [this._columns, this._column];
    }

    this._columns = columns;
    this._column = modifier;

    this._headerRow.attr('colspan', columns.length);
    this._footerRow.attr('colspan', columns.length);

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

    this._column(column);
    return this;
  }

  message(value = null) {
    if (value === null) {
      return this._message;
    }

    clearTimeout(this._timeout);

    if (value === false) {
      return this._deleteMessage();
    }

    this._data = null;

    if (this._message) {
      return this._updateMessage(value);
    }

    return this._insertMessage(value);
  }

  loading(value = null, delay = 250) {
    clearTimeout(this._timeout);

    this._timeout = setTimeout(() => {
      this.message(value);
    }, delay);
  }

  render(data = null, key = null) {
    if (data === null) {
      data = this._data;
      key = this._key;

      this._data = null;
      this._key = null;
    }

    if (isEqual(data, this._data)) {
      return this;
    }

    this._data = data;
    this._key = key;

    const row = this._body
      .selectAll('tr')
      .data(this._data, this._key);

    const cell = row.selectAll('td')
      .data(this._cell);

    const exit = row.exit();

    const enter = row
      .enter()
      .append('tr')
      .merge(row)
      .selectAll('td')
      .data(this._cell)
      .enter()
      .append('td')
      .merge(cell)
      .styles({
        'border-top': '1px solid #CCC',
        'line-height': '3em',
        'overflow': 'hidden',
        'padding': '0 0 0 1em',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap'
      });

    this._exit(exit);
    this._enter(enter);

    return this;
  }

  _insertInset(width) {
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

  _deleteInset() {
    if (this._rootMedia) {
      this._rootMedia.destroy();
      this._rootMedia = null;
    }

    if (this._bodyMedia) {
      this._bodyMedia.destroy();
      this._bodyMedia = null;
    }

    return this;
  }

  _insertHeader() {
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

  _deleteHeader() {
    if (this._header) {
      this._header.destroy();
      this._header = null;
    }

    return this;
  }

  _insertFooter() {
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

  _deleteFooter() {
    if (this._footer) {
      this._footer.destroy();
      this._footer = null;
    }

    return this;
  }

  _insertMessage(text) {
    this._body
      .selectAll('tr')
      .remove();

    this._message = this._body
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

    return this;
  }

  _updateMessage(text) {
    this._message.text(text);
    return this;
  }

  _deleteMessage() {
    if (this._message) {
      this._body
        .selectAll('tr')
        .remove();

      this._message = null;
    }

    return this;
  }
}
