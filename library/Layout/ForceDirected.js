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

  /** / point */
    point(node) {
      if (!(node.id in this.nodePoints)) {
        var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
        this.nodePoints[node.id] = new Point(Vector.random(), mass);
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
            var d = point1.p.subtract(point2.p);
            var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
            var direction = d.normalise();

            // apply force to each end point
            point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
            point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
          }
        });
      });
    }

  /** / applyHookesLaw */
    applyHookesLaw() {
      this.eachSpring(spring => {
        var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
        var displacement = spring.length - d.magnitude();
        var direction = d.normalise();

        // apply force to each end point
        spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
        spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
      });
    }

  /** / attractToCentre */
    attractToCentre() {
      this.eachNode((node, point) => {
        var direction = point.p.multiply(-1.0);
        point.applyForce(direction.multiply(this.repulsion / 50.0));
      });
    }

  /** / updateVelocity */
    updateVelocity(timestep) {
      this.eachNode((node, point) => {
        // Is this, along with updatePosition below, the only places that your
        // integration code exist?
        point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
        if (point.v.magnitude() > this.maxSpeed) {
            point.v = point.v.normalise().multiply(this.maxSpeed);
        }
        point.a = Vector.from(0,0);
      });
    }

  /** / updatePosition */
    updatePosition(timestep) {
      this.eachNode(function(node, point) {
        // Same question as above; along with updateVelocity, is this all of
        // your integration code?
        point.p = point.p.add(point.v.multiply(timestep));
      });
    }

  /** Calculate the total kinetic energy of the system / totalEnergy */
    totalEnergy(timestep) {
      var energy = 0.0;
      this.eachNode(function(node, point) {
        var speed = point.v.magnitude();
        energy += 0.5 * point.m * speed * speed;
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

      Springy.requestAnimationFrame(function step() {
        t.tick(0.03);

        if (render !== undefined) {
          render();
        }

        // stop simulation when energy of the system goes below a threshold
        if (t._stop || t.totalEnergy() < t.minEnergyThreshold) {
          t._started = false;
          if (onRenderStop !== undefined) { onRenderStop(); }
        } else {
          Springy.requestAnimationFrame(step);
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
        var distance = point.p.subtract(pos).magnitude();

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
        if (point.p.x < bottomleft.x) {
          bottomleft.x = point.p.x;
        }
        if (point.p.y < bottomleft.y) {
          bottomleft.y = point.p.y;
        }
        if (point.p.x > topright.x) {
          topright.x = point.p.x;
        }
        if (point.p.y > topright.y) {
          topright.y = point.p.y;
        }
      });

      var padding = topright.subtract(bottomleft).multiply(0.07); // ~5% padding

      return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
    }
  }
