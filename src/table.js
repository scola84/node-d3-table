import { select } from 'd3-selection';
import { controlBar } from '@scola/d3-generic';
import 'd3-selection-multi';

export default class Table {
  constructor() {
    this._enter = [];
    this._empty = null;

    this._footer = null;
    this._header = null;

    this._offset = 0;
    this._model = null;

    this._meta = null;
    this._pages = new Map();

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
        'border-bottom': '1px solid #CCC',
        'border-top': '1px solid #CCC',
        'border-collapse': 'collapse',
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
    if (this._footer) {
      this._footer.destroy();
      this._footer = null;
    }

    if (this._header) {
      this._header.destroy();
      this._header = null;
    }

    if (this._message) {
      this._message.destroy();
      this._message = null;
    }

    this._root.dispatch('destroy');
    this._root.remove();
    this._root = null;
  }

  root() {
    return this._root;
  }

  model(value) {
    if (typeof value === 'undefined') {
      return this._model;
    }

    this._model = value;
    return this;
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
      .classed('footer', true)
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
      .classed('header', true)
      .styles({
        'border-bottom': '1px solid #CCC'
      });

    this._headerRow.node()
      .appendChild(this._header.root().node());

    return this;
  }

  column(element, action) {
    if (action === true) {
      this._columnRow.node()
        .appendChild(element.root().node());

      const colspan = this._columnRow.selectAll('th').size();

      this._headerRow.attr('colspan', colspan);
      this._footerRow.attr('colspan', colspan);
    } else if (action === false) {
      element.root().remove();
    }

    return this;
  }

  enter(value) {
    this._enter.push(value);
    return this;
  }

  empty(value) {
    this._empty = value;
    return this;
  }

  load(callback) {
    this._loadMeta((error) => {
      if (error) {
        callback(error);
        return;
      }

      this._loadPage(null, callback);
    });
  }

  offset(value) {
    if (typeof value === 'undefined') {
      return this._offset;
    }

    this._offset = value;
    return this;
  }

  inset() {
    this._root.styles({
      'padding-left': '1em',
      'padding-right': '1em'
    });

    this._table.styles({
      'border-style': 'none',
      'border-radius': '0.5em'
    });

    return this;
  }

  clear() {
    return this;
  }

  render() {
    if (!this._meta) {
      return this;
    }

    this._body.selectAll('tr').remove();

    if (this._pages.has(this._offset) === false) {
      this._loadPage(this._offset, () => {
        this._render(this._offset);
      });
    } else {
      this._render(this._offset);
    }

    return this;
  }

  _loadMeta(callback) {
    this._model.meta((error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._meta = data;
      callback();
    });
  }

  _loadPage(index, callback) {
    index = index || this._offset;

    this._model.page(index, (error, data) => {
      if (error) {
        callback(error);
        return;
      }

      this._pages.set(index, data);
      callback();
    });
  }

  _render(index) {
    const page = this._pages.get(index);

    if (page.length === 0) {
      if (!this._message) {
        this._message = this._empty();
        this._body.node()
          .appendChild(this._message.root().node());
      }
    } else if (this._message) {
      this._message.destroy();
      this._message = null;
    }

    page.forEach((item, itemIndex) => {
      this._renderItem(item, itemIndex);
    });
  }

  _renderItem(item, index) {
    const row = this._body.append('tr');

    this._enter.forEach((render) => {
      const cell = render(item, select('body')
        .append('td')
        .remove()
        .styles({
          'line-height': '3em',
          'padding': '0 0 0 1em'
        }));

      if (cell) {
        if (index > 0) {
          cell.style('border-top', '1px solid #CCC');
        }

        row.node().appendChild(cell.node());
      }
    });

    if (row.select('td').size() === 0) {
      row.remove();
    }
  }
}
