/* eslint prefer-reflect: "off" */

import { event, select } from 'd3';
import { controlBar } from '@scola/d3-control';
import { Observer } from '@scola/d3-model';
import { scroller } from '@scola/d3-scroller';

export default class Table extends Observer {
  constructor() {
    super();

    this._enter = (s) => s;
    this._exit = (s) => s;
    this._click = () => {};

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

    this._maxCount = null;
    this._rowHeight = 48;

    this._inset = false;

    this._hover = false;
    this._over = false;

    this._swiper = false;
    this._swiped = false;

    this._item = null;
    this._items = new Map();

    this._data = [];

    this._root = select('body')
      .append('div')
      .remove()
      .classed('scola table', true)
      .styles({
        'margin-bottom': '2em'
      });

    this._body = this._root
      .append('div')
      .classed('scola body', true)
      .styles({
        'background': '#FFF',
        'border-bottom': '1px solid #CCC',
        'border-top': '1px solid #CCC',
        'display': 'flex',
        'flex-direction': 'column',
        'position': 'relative'
      });

    this._tableWrapper = this._body
      .append('div')
      .styles({
        'background': '#FFF',
        'flex': '1 1 0%',
        'overflow': 'hidden',
        'position': 'relative'
      });

    this._table = this._tableWrapper
      .append('table')
      .styles({
        'border-collapse': 'collapse',
        'table-layout': 'fixed',
        'width': '100%'
      });

    this._scrollerWrapper = this._tableWrapper
      .append('div')
      .classed('scola scroller', true)
      .styles({
        'background': 'rgba(0, 0, 0, 0.2)',
        'display': 'flex',
        'height': '100%',
        'justify-content': 'center',
        'opacity': 0,
        'padding': '0.125em 0',
        'position': 'absolute',
        'right': '-1px',
        'top': 0,
        'width': '1em'
      });

    this._tableHead = this._table
      .append('thead');

    this._headerRow = this._tableHead
      .append('tr');

    this._handleTotal = (v) => this._total(v);
    this._bindTable();
  }

  destroy() {
    super.destroy();

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

    this._enter = null;
    this._exit = null;
    this._headerModifier = null;

    this._root.dispatch('destroy');
    this._root.remove();
    this._root = null;
  }

  root() {
    return this._root;
  }

  data() {
    return this._data;
  }

  keys() {
    return this._keys;
  }

  click(value = null) {
    if (value === null) {
      return this._click;
    }

    this._click = value;
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

    if (this._rootMedia === null) {
      this._insertInset(width);
    }

    return this;
  }

  item(value = null) {
    if (value === null) {
      return this._item;
    }

    this._item = value;

    this._root
      .classed('item', true);

    this._enter = (s) => this._enterItem(s);
    this._exit = (s) => this._exitItem(s);

    return this;
  }

  header(action = true) {
    if (action === false) {
      return this._deleteHeader();
    }

    if (this._header === null) {
      this._insertHeader();
    }

    return this._header;
  }

  footer(action = true) {
    if (action === false) {
      return this._deleteFooter();
    }

    if (this._footer === null) {
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

    if (this._scroller === null) {
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
      this._swiper = action;
      this._bindSwipe();
    } else if (action === false) {
      this._swiper = action;
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

    if (typeof modifier === 'function') {
      this._headerModifier = modifier;
    }

    this._headerModifier(this._headerCells
      .transition(), this);

    return this;
  }

  message(value = null) {
    if (value === null) {
      return this._message;
    }

    if (value === false) {
      return this._deleteMessage();
    }

    this._data = [];

    if (this._message) {
      return this._updateMessage(value);
    }

    return this._insertMessage(value);
  }

  render(data, keys = null) {
    this._data = data;
    this._keys = keys;

    this._render();
    return this;
  }

  _render() {
    if (this._scroller) {
      this._scroller.resize();
    }

    if (this._headerCells) {
      this._headerModifier(this._headerCells
        .transition(), this);
    }

    let data = this._data;

    if (this._keys === null && this._data.length > 0) {
      data = [data];
    }

    let body = this._table
      .selectAll('tbody:not(.message)')
      .data(data);

    body
      .exit()
      .remove();

    body = body
      .enter()
      .append('tbody')
      .merge(body);

    const row = body
      .selectAll('tr')
      .data((datum) => {
        return Object.values(datum);
      });

    const cell = row.selectAll('td')
      .data((datum) => {
        return this._columns(datum);
      });

    const exit = this._exit(row
      .exit()
      .transition(), this);

    exit.remove();

    const enter = row
      .enter()
      .append('tr')
      .merge(row)
      .selectAll('td')
      .data((datum) => {
        return this._columns(datum);
      })
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

  _bindModel() {
    super._bindModel();

    if (this._model) {
      this._model.on('total', this._handleTotal);
    }
  }

  _unbindModel() {
    super._unbindModel();

    if (this._model) {
      this._model.removeListener('total', this._handleTotal);
    }
  }

  _bindTable() {
    this._table.on('click.scola-table', () => {
      this._click(event);
    });

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
    this._table.on('click.scola-table', null);

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
    this._tableWrapper.on('mouseenter', () => this._mouseenter());
    this._tableWrapper.on('mouseleave', () => this._mouseleave());
  }

  _unbindHover() {
    this._tableWrapper.on('mouseenter', null);
    this._tableWrapper.on('mouseleave', null);
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
        'border-bottom': 'none',
        'border-radius': '0.5em',
        'border-top': 'none',
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
      this._tableWrapper.node());

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
    this._table
      .selectAll('tbody')
      .remove();

    this._message = this._table
      .append('tbody')
      .classed('scola message', true)
      .append('tr')
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

      this._tableWrapper.styles({
        'height': '100%'
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
      this._table
        .selectAll('tbody.message')
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

  _setFormat() {
    this._scroller.format((v) => v - 1);
  }

  _enterItem(selection) {
    const data = selection
      .selection()
      .data();

    selection
      .selection()
      .styles({
        'border': 0,
        'padding': 0
      })
      .on('click.scola-table', (datum, index, nodes) => {
        this._table.selectAll('tr').classed('selected', false);
        select(nodes[index].parentNode).classed('selected', true);
      })
      .append((datum, index, nodes) => {
        let item = this._items.get(nodes[index]);
        item = this._item(item, datum);

        item.first(data.indexOf(datum) === 0);
        this._items.set(nodes[index], item);

        if (item.selected() === true) {
          select(nodes[index].parentNode)
            .classed('selected', true);
        }

        return item.root().node();
      });

    return selection;
  }

  _exitItem(selection) {
    selection
      .selection()
      .on('click.scola-table', null)
      .style('opacity', 0);

    return selection;
  }

  _insertScroller(width) {
    this._scroller = scroller()
      .model(this._model)
      .vertical('0.75em')
      .grow(true)
      .line(false);

    if (this._maximizer) {
      this._setFormat();
    }

    this._scroller.root().on('end.table', () => {
      this._hideScroller();
    });

    this._scrollerWrapper
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
    const cancel =
      this._scroller === null ||
      this._hover === false ||
      this._over === true ||
      this._swiped === true ||
      this._scroller.scrolling() === true;

    if (cancel === true) {
      return;
    }

    this._scrollerWrapper
      .transition()
      .style('opacity', 0)
      .on('end', () => {
        this._scrollerWrapper
          .style('display', 'none');
      });
  }

  _showScroller() {
    const total = this._model.total() || 0;
    const count = this._model.get(this._name) || 0;

    const cancel =
      total < count ||
      this._hover === true &&
      this._over === false ||
      this._swiper === true &&
      this._swiped === false;

    if (cancel === true) {
      return;
    }

    this._scrollerWrapper
      .style('display', 'flex')
      .transition()
      .style('opacity', 1);

    if (this._scroller) {
      this._scroller.resize();
    }
  }

  _change(type) {
    this._root.dispatch(type);
    this._render();
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
    if (this._scroller === null) {
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
    const cancel =
      this._maximizer !== null ||
      setEvent.name !== this._name;

    if (cancel === true) {
      return;
    }

    let height =
      this._tableHead.boundingRect('height') +
      (setEvent.value * this._rowHeight);

    if (this._header) {
      height += this._header.root().boundingRect('height');
    }

    if (this._footer) {
      height += this._footer.root().boundingRect('height');
    }

    this._body.style('height', height + 'px');
  }

  _total(value) {
    if (this._scroller) {
      this._scroller.max(value);
    }
  }

  _equalize() {
    let height =
      this._equalizer.body().boundingRect('height') -
      this._tableHead.boundingRect('height') -
      this._root.computedStyle('margin-bottom');

    if (this._header) {
      height -= this._header.root().boundingRect('height');
    }

    if (this._footer) {
      height -= this._footer.root().boundingRect('height');
    }

    let count = Math.floor(height / this._rowHeight);

    if (Number.isInteger(this._maxCount) === true) {
      count = Math.min(this._maxCount, count);
    }

    if (this._scroller) {
      this._scroller.count(count);
    }

    this._model.set(this._name, count);
    this._render();
  }

  _maximize() {
    const height =
      this._body.boundingRect('height') -
      this._tableHead.boundingRect('height');

    let count = Math.ceil(height / this._rowHeight);

    if (Number.isInteger(this._maxCount) === true) {
      count = Math.min(this._maxCount, count);
    }

    if (this._scroller) {
      this._scroller.count(count);
    }

    this._model.set(this._name, count);
    this._render();
  }

  _columns(datum) {
    return Array(this._headerNames.length || 1).fill(datum);
  }
}
