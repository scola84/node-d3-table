/* eslint prefer-reflect: "off" */

import { select } from 'd3';
import isEqual from 'lodash-es/isEqual';
import { controlBar } from '@scola/d3-control';

export default class Table {
  constructor() {
    this._enter = () => {};
    this._exit = () => {};

    this._headerNames = [];
    this._headerModifier = null;
    this._headerCells = null;

    this._gesture = null;
    this._rootMedia = null;
    this._bodyMedia = null;

    this._header = null;
    this._footer = null;
    this._message = null;

    this._data = null;
    this._key = null;

    this._size = 'small';

    this._root = select('body')
      .append('div')
      .remove()
      .classed('scola table', true)
      .styles({
        'padding-bottom': '3em'
      });

    this._body = this._root
      .append('div')
      .classed('scola body', true)
      .styles({
        'background': '#FFF',
        'border-color': '#CCC',
        'border-style': 'solid',
        'border-width': '1px 0',
        'display': 'flex',
        'flex-direction': 'column',
      });

    this._table = this._body
      .append('table')
      .styles({
        'border-collapse': 'collapse',
        'table-layout': 'fixed',
        'width': '100%'
      });

    this._tableHead = this._table
      .append('thead');

    this._headerRow = this._tableHead
      .append('tr');

    this._tableBody = this._table
      .append('tbody');

    this._bindTable();
  }

  destroy() {
    this._unbindTable();
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

  size(value = null) {
    if (value === null) {
      return this._size;
    }

    this._size = value;
    this.render();

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

  headers(names = null, modifier = null) {
    if (names === null) {
      return this._headerNames;
    }

    this._headerNames = names;
    this._headerModifier = modifier;

    this._headerCells = this._headerRow
      .selectAll('th')
      .data((d) => this._columns(d))
      .enter()
      .append('th')
      .styles({
        'border-bottom': '1px solid #CCC',
        'color': '#AAA',
        'font-weight': 'normal',
        'font-size': '0.9em',
        'padding': '0.5em 0 0.5em 1em',
        'text-align': 'left',
        'text-transform': 'uppercase',
        'vertical-align': 'center'
      });

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

    this._headerModifier(this._headerCells, this);

    const row = this._tableBody
      .selectAll('tr')
      .data(this._data, this._key);

    const cell = row.selectAll('td')
      .data((d) => this._columns(d));

    const exit = row.exit();

    const enter = row
      .enter()
      .append('tr')
      .merge(row)
      .selectAll('td')
      .data((d) => this._columns(d))
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

    this._exit(exit, this);
    this._enter(enter, this);

    return this;
  }

  _bindTable() {
    this._gesture = this._table
      .gesture()
      .on('panstart', (e) => e.stopPropagation())
      .on('panright', (e) => e.stopPropagation())
      .on('panleft', (e) => e.stopPropagation())
      .on('panend', (e) => e.stopPropagation())
      .on('swiperight', (e) => e.stopPropagation())
      .on('swipeleft', (e) => e.stopPropagation())
      .on('tap', (e) => e.stopPropagation());
  }

  _unbindTable() {
    if (this._gesture) {
      this._gesture.destroy();
      this._gesture = null;
    }
  }

  _insertInset(width) {
    this._rootMedia = this._root
      .media(`not all and (min-width: ${width})`)
      .call(() => this.size('small'))
      .media(`(min-width: ${width})`)
      .call(() => this.size('large'))
      .styles({
        'padding-left': '1em',
        'padding-right': '1em'
      })
      .start();

    this._bodyMedia = this._body
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

    this._body.node().insertBefore(this._header.root().node(),
      this._table.node());

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

    this._body.node()
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
    this._tableBody
      .selectAll('tr')
      .remove();

    this._message = this._tableBody
      .append('tr')
      .classed('scola message', true)
      .append('td')
      .attr('colspan', this._headerNames.length)
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
      this._tableBody
        .selectAll('tr')
        .remove();

      this._message = null;
    }

    return this;
  }

  _columns(datum) {
    return Array(this._headerNames.length).fill(datum);
  }
}
