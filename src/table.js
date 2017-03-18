/* eslint prefer-reflect: "off" */

import { event, select } from 'd3';
import isEqual from 'lodash-es/isEqual';
import { controlBar } from '@scola/d3-control';
import { Observer } from '@scola/d3-model';
import { scroller } from '@scola/d3-scroller';

export default class Table extends Observer {
  constructor() {
    super();

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

    this._maximizer = null;
    this._equalizer = null;

    this._maxCount = 0;
    this._rowHeight = 48;

    this._inset = false;
    this._over = false;
    this._swiped = false;

    this._data = null;
    this._key = null;

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

    this._bindTable();
  }

  destroy() {
    this._unbindInsetHover();
    this._unbindInsetSwipe();
    this._unbindHover();
    this._unbindSwipe();

    this._unbindEqualizer();
    this._unbindMaximizer();
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

  count(value = null) {
    if (value === null) {
      return this._maxCount;
    }

    this._maxCount = value;
    return this;
  }

  height(value = null) {
    if (value === null) {
      return this._rowHeight;
    }

    this._rowHeight = value;
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

  equalizer(element = null) {
    if (element === null) {
      return this._equalizer;
    }

    this._equalizer = element;
    this._bindEqualizer();

    return this;
  }

  maximizer(element = null) {
    if (element === null) {
      return this._maximizer;
    }

    this._maximizer = element;
    this._bindMaximizer();

    if (this._scroller) {
      this._setFormat();
    }

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

  hover(action = true) {
    if (action === true) {
      this._hover = true;
      this._bindHover();
      this._hideScroller();
    } else if (action === false) {
      this._hover = false;
      this._unbindHover();
      this._showScroller();
    } else if (action === 'change') {
      this._bindInsetHover();
    }

    return this;
  }

  swipe(action = true) {
    if (action === true) {
      this._bindSwipe();
    } else if (action === false) {
      this._unbindSwipe();
    } else if (action === 'change') {
      this._bindInsetSwipe();
    }

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

    if (this._scroller) {
      this._scroller.resize();
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
      .on('swipeleft', (e) => e.stopPropagation());
  }

  _unbindTable() {
    if (this._gesture) {
      this._gesture.destroy();
      this._gesture = null;
    }
  }

  _bindEqualizer() {
    if (this._equalizer) {
      this._equalizer.root().on('resize.scola-table', () => {
        this._equalize();
      });
    }
  }

  _unbindEqualizer() {
    if (this._equalizer) {
      this._equalizer.root().on('resize.scola-table', null);
    }
  }

  _bindMaximizer() {
    if (this._maximizer) {
      this._maximizer.root().on('resize.scola-table', () => {
        this._maximize();
      });
    }
  }

  _unbindMaximizer() {
    if (this._maximizer) {
      this._maximizer.root().on('resize.scola-table', null);
    }
  }

  _bindHover() {
    this._body.on('mouseenter', () => this._mouseenter());
    this._body.on('mouseleave', () => this._mouseleave());
  }

  _unbindHover() {
    this._body.on('mouseenter', null);
    this._body.on('mouseleave', null);
  }

  _bindInsetHover() {
    this._root.on('inset.scola-table outset.scola-table', () => {
      this.hover(event.type === 'inset');
    });
  }

  _unbindInsetHover() {
    this._root.on('.scola-table', null);
  }

  _bindSwipe() {
    this._gesture
      .on('swipeup', (e) => this._swipe(e))
      .on('swipedown', (e) => this._swipe(e))
      .on('tap', (e) => this._tap(e));

    this._gesture.get('swipe').set({
      direction: 30
    });
  }

  _unbindSwipe() {
    this._gesture
      .off('swipeup')
      .off('swipedown')
      .off('tap');
  }

  _bindInsetSwipe() {
    this._root.on('inset.scola-table outset.scola-table', () => {
      this.swipe(event.type !== 'inset');
    });
  }

  _unbindInsetSwipe() {
    this._root.on('.scola-table', null);
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

    if (this._maximizer) {
      this._message.styles({
        'color': '#AAA',
        'font-size': '2em'
      });

      this._table.styles({
        'height': '100%'
      });
    }

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

    if (this._maximizer) {
      this._table.styles({
        'height': null
      });
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

  _setFormat() {
    this._scroller.format((v) => v - 1);
  }

  _insertScroller(width) {
    this._scroller = scroller()
      .model(this._model)
      .vertical('1em')
      .line(false);

    if (this._maximizer) {
      this._setFormat();
    }

    this._scroller.root().on('end.table', () => {
      this._hideScroller();
    });

    this._container
      .append(() => this._scroller.root().node());

    this._scrollerMedia = this._root
      .media(`not all and (min-width: ${width})`)
      .call(() => this._change('outset'))
      .media(`(min-width: ${width})`)
      .call(() => this._change('inset'))
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
    const cancel = !this._scroller ||
      this._hover === false ||
      this._over === true ||
      this._swiped === true ||
      this._scroller.scrolling();

    if (cancel) {
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
    const total = this._model.get('total') || 0;
    const count = this._model.get('count') || 0;

    const cancel =
      total < count ||
      this._hover === true &&
      this._over === false ||
      this._swipe === false;

    if (cancel) {
      return;
    }

    this._container
      .style('display', 'flex')
      .transition()
      .style('opacity', 1);

    if (this._scroller) {
      this._scroller.resize();
    }
  }

  _change(type) {
    this._root.dispatch(type);
    this.render();
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

  _swipe(swipeEvent) {
    if (!this._scroller) {
      return;
    }

    this._swiped = true;
    this._showScroller();

    if (swipeEvent.type === 'swipeup') {
      this._scroller.up();
    } else if (swipeEvent.type === 'swipedown') {
      this._scroller.down();
    }
  }

  _set(setEvent) {
    const cancel = this._maximizer ||
      setEvent.name !== 'count';

    if (cancel) {
      return;
    }

    const height = parseFloat(this._tableHead.style('height')) +
      (setEvent.value * this._rowHeight);

    this._body.style('height', height + 'px');
  }

  _equalize() {
    const height = parseFloat(this._equalizer.body().style('height')) -
      parseFloat(this._tableHead.style('height')) -
      parseFloat(this._root.style('padding-bottom'));

    let count = Math.floor(height / this._rowHeight);

    if (this._maxCount) {
      count = Math.min(this._maxCount, count);
    }

    this._model.set('count', count);
    this.render();
  }

  _maximize() {
    const height = parseFloat(this._body.style('height')) -
      parseFloat(this._tableHead.style('height'));

    let count = Math.ceil(height / this._rowHeight);

    if (this._maxCount) {
      count = Math.min(this._maxCount, count);
    }

    this._model.set('count', count);
    this.render();
  }

  _columns(datum) {
    return Array(this._headerNames.length || 1).fill(datum);
  }
}
