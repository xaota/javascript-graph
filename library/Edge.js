/** {Edge} Хранение рёбер графа @class @export @default
  *
  */
  export default class Edge {
  /** {Edge} Создание объекта, описывающего направленное ребро графа @constructor
    * @param {} id идентификатор ребра
    * @param {Node} source вершина-источник
    * @param {Node} target вершина-сток
    * @param {object} data данные ребра {length, type}
    */
    constructor(id, source, target, data = {}) {
      this.id = id;
      this.source = source;
      this.target = target;
      this.data = data;
    }
  }
