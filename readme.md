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
      "javascript-algebra": "/javascript-algebra/index.js",
      "javascript-algebra/": "/javascript-algebra/library/",

      "javascript-graph": "/javascript-graph/index.js",
      "javascript-graph/": "/javascript-graph/library/"
    }
  }
  </script>
```

## Использование
```javascript
import Graph from 'javascript-graph';

const graph = new Graph();

...
```
