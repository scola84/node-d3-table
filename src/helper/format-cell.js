export default function formatCell(table, values) {
  return (datum, index) => {
    const names = table.headers();
    const size = table.size();
    const name = names[index];

    const value = values[name] && values[name][size] ||
      values[name] ||
      values[size] ||
      values;

    return typeof value === 'function' ?
      value(datum, index, name) :
      value;
  };
}
