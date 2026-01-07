const { Graphviz } = require('@hpcc-js/wasm');
const fs = require('fs');

async function compile() {
  const dot = fs.readFileSync(0, 'utf-8'); // Read from stdin
  const graphviz = await Graphviz.load();
  const svg = graphviz.layout(dot, 'svg', 'dot');
  console.log(svg);
}

compile().catch((err) => {
  console.error(err);
  process.exit(1);
});
