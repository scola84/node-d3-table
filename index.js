import Table from './src/table';

export { default as formatCell } from './src/helper/format-cell';

export function table() {
  return new Table();
}
