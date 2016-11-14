import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';

export default {
  dest: './dist/d3-table.js',
  entry: 'index.js',
  format: 'umd',
  moduleName: 'd3',
  plugins: [
    resolve({
      jsnext: true
    }),
    buble()
  ]
};
