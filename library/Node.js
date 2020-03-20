/** {Node} Хранение вершины графа @class @export @default
  *
  */
  export default class Node {
  /** {Node} Создание объекта, описывающего вершину графа @constructor
    * @param {} id идентификатор вершины
    * @param {object} data данные вершины {mass, label}
    */
    constructor(id, data = {}) {
      this.id   = id;
      this.data = data;
    }
  }
