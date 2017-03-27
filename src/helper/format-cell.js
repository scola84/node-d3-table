export default function formatCell(table, values) {
  return (datum, index) => {
    const names = table.headers();
    const set = table.inset(null) === true ? 'in' : 'out';
    const name = names[index];

    const value =
      values[name] &&
      values[name][set] ||
      values[name] ||
      values[set] ||
      values;

    return typeof value === 'function' ?
      value(datum, index, name) :
      value;
  };
}
