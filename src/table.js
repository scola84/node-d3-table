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
    this._scrollerMedia = null;

    this._header = null;
    this._footer = null;
    this._scroller = null;
    this._message = null;

    this._data = null;
    this._key = null;

    this._inset = false;
    this._maximized = false;
    this._over = false;
    this._swiped = false;

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

    this._handleSet = (e) => this._set(e);
    this._bindTable();
  }

  destroy() {
    this._unbindTable();

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

  model(value = null) {
    if (value === null) {
      return this._model;
    }

    this._model = value;
    this._bindModel();

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
    if (width === null) {
      return this._inset;
    }

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

  scroller(width = '48em') {
    if (width === null) {
      return this._scroller;
    }

    if (width === false) {
      return this._deleteScroller();
    }

    if (!this._scroller) {
      this._insertScroller(width);
    }

    return this._scroller;
  }

  maximize() {
    this._maximized = true;

    this._root.styles({
      'height': '100%',
      'left': 0,
      'padding': 0,
      'position': 'absolute',
      'top': 0,
      'width': '100%'
    });

    this._body.styles({
      'border': 0,
      'height': '100%',
      'overflow': 'hidden'
    });

    return this;
  }

  headers(names = null, modifier = null) {
    if (names === null) {
      return this._headerNames;
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

    if (modifier) {
      this._headerModifier = modifier;
    }

    this._headerModifier(this._headerCells
      .transition(), this);

    return this;
  }

  message(value = null, delay = null) {
    if (value === null) {
      return this._message;
    }

    clearTimeout(this._timeout);

    if (value === false) {
      return this._deleteMessage();
    }

    if (delay !== null) {
      return this._delayMessage(value, delay);
    }

    this._data = null;

    if (this._message) {
      return this._updateMessage(value);
    }

    return this._insertMessage(value);
  }

  resize() {
    if (this._maximized === true) {
      const height = parseFloat(this._body.style('height'));
      this._model.set('count', Math.ceil(height / (3 * 16)));
    } else {
      const height = (this._model.get('count') * 3) + 1.875;
      this._body.style('height', height + 'em');

      if (this._scroller) {
        this._scroller.resize();
      }
    }

    this.render();
    return this;
  }

  render(data = null, key = null) {
    if (data === null) {
      data = this._data;
      key = this._key;

      this._data = null;
      this._key = null;
    }

    if (isEqual(data, this._data)) {
      return;
    }

    this._data = data;
    this._key = key;

    if (this._headerCells) {
      this._headerModifier(this._headerCells
        .transition(), this);
    }

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

  _bindTable() {
    this._body.on('mouseenter', () => this._mouseenter());
    this._body.on('mouseleave', () => this._mouseleave());

    this._gesture = this._table
      .gesture()
      .on('panstart', (e) => e.stopPropagation())
      .on('panright', (e) => e.stopPropagation())
      .on('panleft', (e) => e.stopPropagation())
      .on('panend', (e) => e.stopPropagation())
      .on('swiperight', (e) => e.stopPropagation())
      .on('swipeleft', (e) => e.stopPropagation())
      .on('swipeup', (e) => this._swipe(e))
      .on('swipedown', (e) => this._swipe(e))
      .on('tap', (e) => this._tap(e));

    this._gesture.get('swipe').set({
      direction: 30
    });
  }

  _unbindTable() {
    this._body.on('mouseenter', null);
    this._body.on('mouseleave', null);

    if (this._gesture) {
      this._gesture.destroy();
      this._gesture = null;
    }
  }

  _bindModel() {
    if (this._model) {
      this._model.setMaxListeners(this._model.getMaxListeners() + 1);
      this._model.addListener('set', this._handleSet);
    }
  }

  _unbindModel() {
    if (this._model) {
      this._model.setMaxListeners(this._model.getMaxListeners() - 1);
      this._model.removeListener('set', this._handleSet);
    }
  }

  _insertInset(width) {
    this._rootMedia = this._root
      .media(`not all and (min-width: ${width})`)
      .call(() => { this._inset = false; })
      .media(`(min-width: ${width})`)
      .call(() => { this._inset = true; })
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

    this._body
      .append(() => this._footer.root().node());

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

  _delayMessage(text, delay) {
    delay = delay === true ? 250 : delay;

    clearTimeout(this._timeout);

    this._timeout = setTimeout(() => {
      this.message(text);
    }, delay);

    return this;
  }

  _insertScroller(width) {
    this._scroller = scroller()
      .vertical('1em')
      .line(false)
      .tabindex(0);

    this._scroller.root().on('end.table', () => {
      this._hideScroller();
    });

    this._container
      .append(() => this._scroller.root().node());

    this._scrollerMedia = this._root
      .media(`not all and (min-width: ${width})`)
      .call(() => this.resize())
      .media(`(min-width: ${width})`)
      .call(() => this.resize())
      .start();

    return this;
  }

  _deleteScroller() {
    if (this._scroller) {
      this._scroller.root().on('end.table', null);
      this._scroller.destroy();
      this._scroller = null;
    }

    if (this._scrollerMedia) {
      this._scrollerMedia.destroy();
      this._scrollerMedia = null;
    }

    return this;
  }

  _hideScroller() {
    const show = !this._scroller ||
      this._over === true ||
      this._swiped === true ||
      this._scroller.scrolling();

    if (show) {
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
    const hide = !this._scroller ||
      this._model.get('total') === 0;

    if (hide) {
      return;
    }

    this._container
      .style('display', 'flex')
      .transition()
      .style('opacity', 1);

    this._scroller.resize();
  }

  _mouseenter() {
    if (this._swiped === true) {
      return;
    }

    this._over = true;
    this._showScroller();
  }

  _mouseleave() {
    this._over = false;
    this._swiped = false;
    this._hideScroller();
  }

  _tap() {
    const swiped = this._swiped;
    this._swiped = false;

    if (swiped === true) {
      this._hideScroller();
    }
  }

  _swipe(event) {
    if (!this._scroller) {
      return;
    }

    this._swiped = true;
    this._showScroller();

    if (event.type === 'swipeup') {
      this._scroller.up();
    } else if (event.type === 'swipedown') {
      this._scroller.down();
    }
  }

  _set(setEvent) {
    const cancel = setEvent.changed === false ||
      setEvent.name !== 'total' &&
      setEvent.name !== 'count';

    if (cancel) {
      if (setEvent.name === 'count') {
        this._scroller.resize();
      }

      return;
    }

    if (!this._model.has('total') || !this._model.has('count')) {
      return;
    }

    const total = this._model.get('total');
    const count = this._model.get('count') -
      (this._maximized === true ? 1 : 0);

    const max = Math.max(0, Math.ceil((total - count) / count));

    this._scroller.domain([0, max]);
    this._scroller.resize();
  }

  _columns(datum) {
    return Array(this._headerNames.length || 1).fill(datum);
  }
}
