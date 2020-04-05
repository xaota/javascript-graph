import Vector from 'javascript-algebra/Vector.js';

import Point  from '../Point.js';
import Spring from '../Spring.js';

/** {ForceDirected} Раскладка графа | Силовой алгоритм @class @export @default
  *
  */
  export default class ForceDirected {
  /** {ForceDirected} Создание объекта, упраляющего раскладкой графа @constructor
    * @param {}
    */
    constructor(graph, stiffness, repulsion, damping, minEnergyThreshold, maxSpeed) {
      this.graph = graph;
      this.stiffness = stiffness; // spring stiffness constant
      this.repulsion = repulsion; // repulsion constant
      this.damping = damping; // velocity damping factor
      this.minEnergyThreshold = minEnergyThreshold || 0.01; //threshold used to determine render stop
      this.maxSpeed = maxSpeed || Infinity; // nodes aren't allowed to exceed this speed

      this.nodePoints = {}; // keep track of points associated with nodes
      this.edgeSprings = {}; // keep track of springs associated with edges
    }

  // itemCount = 0;
  randomlyDiagonalVector() {
    // this.itemCount += 1;
    const value = () => 10.0 * (Math.random() - 0.5);
    // const value = () => 3.0 * (this.itemCount * 3 - 0.5) + Math.random() % 10;
    // const value = () => 3.0 * (this.itemCount / 2 + Math.random()) - this.itemCount*1.5;
    return Vector.from(value(), value()); //ADDED PER
  }

  /** / point */
    point(node) {
      if (!(node.id in this.nodePoints)) {
        if (!node.data) debugger;
        var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
        // this.nodePoints[node.id] = new Point(Vector.from(10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5)), mass);
        this.nodePoints[node.id] = new Point(this.randomlyDiagonalVector(), mass);
      }

      return this.nodePoints[node.id];
    }

  /** / spring */
    spring(edge) {
      if (!(edge.id in this.edgeSprings)) {
        var length = (edge.data.length !== undefined) ? edge.data.length : 1.0;

        var existingSpring = false;

        var from = this.graph.getEdges(edge.source, edge.target);
        from.forEach(e => {
          if (existingSpring === false && e.id in this.edgeSprings) {
            existingSpring = this.edgeSprings[e.id];
          }
        }, this);

        if (existingSpring !== false) {
          return new Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
        }

        var to = this.graph.getEdges(edge.target, edge.source);
        from.forEach(e => {
          if (existingSpring === false && e.id in this.edgeSprings) {
            existingSpring = this.edgeSprings[e.id];
          }
        });

        if (existingSpring !== false) {
          return new Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
        }

        this.edgeSprings[edge.id] = new Spring(this.point(edge.source), this.point(edge.target), length, this.stiffness);
      }

      return this.edgeSprings[edge.id];
    }

    /** callback should accept two arguments: Node, Point / eachNode */
    eachNode(callback) {
      this.graph.nodes.forEach(n => {
        callback.call(this, n, this.point(n));
      });
    };

    /** callback should accept two arguments: Edge, Spring / eachEdge */
    eachEdge(callback) {
      this.graph.edges.forEach(e =>{
        callback.call(this, e, this.spring(e));
      });
    }

    /** callback should accept one argument: Spring / eachSpring */
    eachSpring(callback) {
      this.graph.edges.forEach(e => {
        callback.call(this, this.spring(e));
      });
    }


    /** Physics stuff / applyCoulombsLaw */
    applyCoulombsLaw() {
      this.eachNode(function(n1, point1) {
        this.eachNode(function(n2, point2) {
          if (point1 !== point2) {
            var d = point1.position.difference(point2.position);
            var distance = d.length() + 0.1; // .length | avoid massive forces at small distances (and divide by zero)
            var direction = d.normalize();

            // apply force to each end point
            point1.applyForce(direction.scale(this.repulsion).divide(distance * distance * 0.5));
            point2.applyForce(direction.scale(this.repulsion).divide(distance * distance * -0.5));
          }
        });
      });
    }

  /** / applyHookesLaw */
    applyHookesLaw() {
      this.eachSpring(spring => {
        var d = spring.point2.position.difference(spring.point1.position); // the direction of the spring
        var displacement = spring.length - d.length();
        var direction = d.normalize();

        // apply force to each end point
        spring.point1.applyForce(direction.scale(spring.k * displacement * -0.5));
        spring.point2.applyForce(direction.scale(spring.k * displacement * 0.5));
      });
    }

  /** / attractToCentre */
    attractToCentre() {
      this.eachNode((node, point) => {
        var direction = point.position.scale(-1.0);
        point.applyForce(direction.scale(this.repulsion / 50.0));
      });
    }

  /** / updateVelocity */
    updateVelocity(timestep) {
      this.eachNode((node, point) => {
        // Is this, along with updatePosition below, the only places that your
        // integration code exist?
        point.velocity = point.velocity.addition(point.acceleration.scale(timestep)).scale(this.damping);
        if (point.velocity.length() > this.maxSpeed) {
            point.velocity = point.velocity.normalize().scale(this.maxSpeed);
        }
        point.acceleration = Vector.zero;
      });
    }

  /** / updatePosition */
    updatePosition(timestep) {
      this.eachNode(function(node, point) {
        // Same question as above; along with updateVelocity, is this all of
        // your integration code?
        point.position = point.position.addition(point.velocity.scale(timestep));
      });
    }

  /** Calculate the total kinetic energy of the system / totalEnergy */
    totalEnergy(timestep) {
      var energy = 0.0;
      this.eachNode(function(node, point) {
        var speed = point.velocity.length();
        energy += 0.5 * point.mass * speed * speed;
      });

      return energy;
    }

  /** Start simulation if it's not running already.
    * In case it's running then the call is ignored, and none of the callbacks passed is ever executed.
    */
    start(render, onRenderStop, onRenderStart) {
      var t = this;

      if (this._started) return;
      this._started = true;
      this._stop = false;

      if (onRenderStart !== undefined) { onRenderStart(); }

      requestAnimationFrame(function step() {
        t.tick(0.03);

        if (render !== undefined) {
          render();
        }

        // stop simulation when energy of the system goes below a threshold
        if (t._stop || t.totalEnergy() < t.minEnergyThreshold) {
          t._started = false;
          if (onRenderStop !== undefined) { onRenderStop(); }
        } else {
          requestAnimationFrame(step);
        }
      });
    }

  /** / stop */
    stop() {
      this._stop = true;
    }

  /** / tick */
    tick(timestep) {
      this.applyCoulombsLaw();
      this.applyHookesLaw();
      this.attractToCentre();
      this.updateVelocity(timestep);
      this.updatePosition(timestep);
    }

  /** Find the nearest point to a particular position / nearest */
    nearest(pos) {
      var min = {node: null, point: null, distance: null};
      var t = this;
      this.graph.nodes.forEach(n =>{
        var point = t.point(n);
        var distance = point.position.difference(pos).length();

        if (min.distance === null || distance < min.distance) {
          min = {node: n, point, distance};
        }
      });

      return min;
    }

  /** / getBoundingBox
    * @return {Array} [bottomleft, topright]
    */
    getBoundingBox() {
      var bottomleft = Vector.from(-2,-2);
      var topright = Vector.from(2,2);

      this.eachNode(function(n, point) {
        if (point.position.x < bottomleft.x) {
          bottomleft.x = point.position.x;
        }
        if (point.position.y < bottomleft.y) {
          bottomleft.y = point.position.y;
        }
        if (point.position.x > topright.x) {
          topright.x = point.position.x;
        }
        if (point.position.y > topright.y) {
          topright.y = point.position.y;
        }
      });

      var padding = topright.subtract(bottomleft).scale(0.07); // ~5% padding

      return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
    }
  }
