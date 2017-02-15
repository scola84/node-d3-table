/* eslint prefer-reflect: "off" */

import { select } from 'd3';
import isEqual from 'lodash-es/isEqual';
import { controlBar } from '@scola/d3-control';
import { scroller } from '@scola/d3-scroller';

export default class Table {
  constructor() {
    this._enter = (s) => s;
    this._exit = (s) => s;

    this._headerNames = [];
    this._headerModifier = (s) => s;
    this._headerCells = null;

    this._gesture = null;
    this._rootMedia = null;
    this._bodyMedia = null;

    this._header = null;
    this._footer = null;
    this._scroller = null;
    this._message = null;

    this._data = null;
    this._key = null;

    this._size = 'small';
    this._hover = false;

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
        'height': '31.875em',
        'position': 'relative'
      });

    this._container = this._body
      .append('div')
      .classed('scola scroller', true)
      .styles({
        'background': 'rgba(0, 0, 0, 0.2)',
        'display': 'flex',
        'height': '100%',
        'justify-content': 'center',
        'opacity': 0,
        'padding': '0.25em 0',
        'position': 'absolute',
        'right': 0,
        'top': 0,
        'width': '1.5em'
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

    this._bindContainer();
    this._bindTable();
  }

  destroy() {
    this._unbindContainer();
    this._unbindTable();
    this._unbindTableHover();

    this._deleteInset();
    this._deleteHeader();
    this._deleteFooter();
    this._deleteScroller();
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

  hover(value = null) {
    if (value === null) {
      return this._hover;
    }

    this._hover = value;
    return this;
  }

  size(value = null) {
    if (value === null) {
      return this._size;
    }

    this._size = value;

    this._toggleScroller();
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

  scroller(action = true) {
    if (action === false) {
      return this._deleteScroller();
    }

    if (!this._scroller) {
      this._insertScroller();
    }

    return this._scroller;
  }

  headers(names = null, modifier = null) {
    if (names === null) {
      return this._headerNames;
    }

    if (modifier) {
      this._headerModifier = modifier;
    }

    this._headerNames = names;
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

    this._headerModifier(this._headerCells
      .transition(), this);

    const row = this._tableBody
      .selectAll('tr')
      .data(this._data, this._key);

    const cell = row.selectAll('td')
      .data((d) => this._columns(d));

    const exit = this._exit(row
      .exit()
      .transition(), this);

    exit.remove();

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
        'height': '3em',
        'overflow': 'hidden',
        'padding': '0 0 0 1em',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap'
      });

    this._enter(enter.transition(), this);
  }

  _bindContainer() {
    this._body.on('click', () => this._click());
  }

  _unbindContainer() {
    this._body.on('click', null);
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
      .on('swipeup', (e) => this._swipe(e))
      .on('swipedown', (e) => this._swipe(e));

    this._gesture.get('swipe').set({
      direction: 30
    });
  }

  _unbindTable() {
    if (this._gesture) {
      this._gesture.destroy();
      this._gesture = null;
    }
  }

  _bindTableHover() {
    this._body.on('mouseover', () => this._showScroller());
    this._body.on('mouseout', () => this._hideScroller());
  }

  _unbindTableHover() {
    this._body.on('mouseover', null);
    this._body.on('mouseout', null);
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

  _insertScroller() {
    this._scroller = scroller()
      .vertical('1em')
      .line(false)
      .tabindex(0);

    this._container
      .node()
      .appendChild(this._scroller.root().node());

    this._toggleScroller();
    return this;
  }

  _deleteScroller() {
    if (this._scroller) {
      this._scroller.destroy();
      this._scroller = null;
    }

    return this;
  }

  _hideScroller() {
    if (!this._scroller) {
      return;
    }

    this._container
      .transition()
      .style('opacity', 0)
      .on('end', () => {
        this._container
          .style('display', 'none');
      });
  }

  _showScroller() {
    if (!this._scroller) {
      return;
    }

    this._container
      .style('display', 'flex')
      .transition()
      .style('opacity', 1);
  }

  _toggleScroller() {
    if (this._size === 'large') {
      this._toggleScrollerLarge();
    } else {
      this._toggleScrollerSmall();
    }
  }

  _toggleScrollerLarge() {
    if (this._hover === true) {
      this._bindTableHover();
    } else {
      this._showScroller();
    }
  }

  _toggleScrollerSmall() {
    if (this._hover === true) {
      this._unbindTableHover();
    }

    this._hideScroller();
  }

  _click() {
    const opacity = Number(this._container.style('opacity'));

    if (this._size === 'small' && opacity === 1) {
      event.stopPropagation();
      this._hideScroller();
    }
  }

  _swipe(event) {
    if (!this._scroller) {
      return;
    }

    this._showScroller();

    if (event.type === 'swipeup') {
      this._scroller.up();
    } else if (event.type === 'swipedown') {
      this._scroller.down();
    }
  }

  _columns(datum) {
    return Array(this._headerNames.length).fill(datum);
  }
}
