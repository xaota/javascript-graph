# javascript-graph

Работа с графами

## Установка
```shell
$ npm install javascript-graph
```

### Настройка браузера
Надо настроить в вашем сервере резолв с `/javascript-graph` в `node_modules/javascript-graph`. Аналогично с пакетом `javascript-algebra`.

```html
  <script type="importmap">
  {
    "imports": {
      "javascript-std-lib": "/javascript-std-lib/index.js",
      "javascript-std-lib/": "/javascript-std-lib/library/",

      "javascript-algebra": "/javascript-algebra/index.js",
      "javascript-algebra/": "/javascript-algebra/library/",

      "javascript-graph": "/javascript-graph/index.js",
      "javascript-graph/": "/javascript-graph/library/"
    }
  }
  </script>
```

## Использование
> Создание графа
```javascript
import Graph from 'javascript-graph/Graph.js';

const graph = new Graph();

// Вершины
const node1 = graph.newNode({label: '1'});
const node2 = graph.newNode({label: '2'});

// Рёбра
graph.newEdge(node1, node2);

// Добавление "набора"
graph.addNodes('mark', 'higgs', 'other', 'etc');
graph.addEdges(
  ['mark', 'higgs'],
  ['mark', 'etc'],
  ['mark', 'other']
);

// Добавление из объекта
const graphOBJ = {
  nodes: ["mark2", "higgs2", "other2", "etc2"],
  edges: [
    ["mark", "higgs2"],
    ["mark2", "etc"],
    ["mark2", "other2"],
    ["etc2", "0"]
  ]
};
graph.loadOBJ(graphOBJ);
...
```

> Вывод в консоли
```javascript
graph.toString()
```

> Рисование графа
```javascript
import ForceDirected from 'javascript-graph/layout/ForceDirected.js';
import Renderer      from 'javascript-graph/Renderer.js';

const layout = new ForceDirected(graph, 400.0, 200.0, 0.1, 0.1);
const renderer = new Renderer(layout,
  function clear() {/* сброс предыдущего кадра */},
  function drawEdge(edge, p1, p2) {/* рисование ребра */},
  function drawNode(node, p) {/* рисование вершины */}
);

renderer.start();
```

<details>
  <summary>Пример создания Renderer для canvas</summary>

    const canvas  = document.querySelector('canvas');
    cosnt context = canvas.getContext('2d');

    const renderer = new Renderer(layout,
      function clear() {
        context.clearRect(0, 0, width, height);
      },

      function drawEdge(edge, p1, p2) {
        context.save();
        context.translate(center.x, center.y);

        context.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        context.lineWidth = 3.0;

        context.beginPath();
        context.moveTo(p1.x * 50, p1.y * 40);
        context.lineTo(p2.x * 50, p2.y * 40);
        context.stroke();

        context.restore();
      },

      function drawNode(node, p) {
        context.save();
        context.translate(center.x, center.y);

        context.font = "18px serif";

        const width = ctx.measureText(node.data.label).width;
        const x = p.x * 50;
        const y = p.y * 40;
        context.clearRect(x - width / 2.0 - 2, y - 10, width + 4, 20);
        context.fillStyle = '#000000';
        context.fillText(node.data.label, x - width / 2.0, y + 5);

        context.restore();
      }
    );
</details>

### Дополнительно
Если вы используете vscode, можно настроить резолв для корректной работы самого редактора с помощью файла `jsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": "../node_modules/",
    "paths": {
      "javascript-graph/*": ["./javascript-graph/library/*"]
    }
  }
}
```
