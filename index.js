import Table from './src/table';
import TableColumn from './src/column';
import TableMessage from './src/message';

export function table() {
  return new Table();
}

export function tableColumn() {
  return new TableColumn();
}

export function tableMessage() {
  return new TableMessage();
}
