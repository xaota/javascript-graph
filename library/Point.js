import Vector from 'javascript-algebra/Vector.js';

/** {Point} Материальная точка @physics @class @export @default
  *
  */
  export default class Point {
  /** {Point} Создание объекта материальной точки @constructor
    * @param {Vector} position положение точки в пространстве
    * @param {number} mass масса точки
    */
    constructor(position, mass) {
      this.dimension = position.dimension;
      this.position = position;
      this.mass = mass;
      this.velocity     = Vector.empty(this.dimension);
      this.acceleration = Vector.empty(this.dimension);
    }

  /** / applyForce
    * @param {Vector} force вектор прилагаемой силы
    * @return {Point} @this материальная точка
    */
    applyForce(force) {
      this.acceleration = this.acceleration.addition(force.divide(this.mass));
      return this;
    }
  }
