import Obj from 'javascript-std-lib/object.js';

import Node from './Node.js';
import Edge from './Edge.js';

/** {Graph} Хранение графа @class @export @default
  *
  */
  export default class Graph {
  /** {Graph} создание объекта, описывающего граф @constructor
    */
    constructor() {
      this.nodeSet = {};
      this.nodes = [];
      this.edges = [];
      this.adjacency = {};

      this.nextNodeId = 0;
      this.nextEdgeId = 0;
      this.eventListeners = [];
    }

  /** / toString */
    toString() {
      const nodes = this.nodes.length <= 16 ? `\n  ${this.nodes.join('\n  ')}\n` : '';
      const edges = this.edges.length <= 16 ? `\n  ${this.edges.join('\n  ')}`   : '';
      return `Nodes: ${this.nodes.length}${nodes}\nEdges: ${this.edges.length}${edges}`;
    }

  /** / addNode */
    addNode(node) {
      if (!(node.id in this.nodeSet)) this.nodes.push(node);
      this.nodeSet[node.id] = node;

      this.notify();
      return node;
    }

  /** / addNodes */
    addNodes(...nodes) {
      nodes.forEach(name => this.addNode(new Node(name, { label:name })));
      return this;
    }

  /** / addEdge */
    addEdge(edge) {
      let exists = false;
      this.edges.forEach(function(e) {
        if (edge.id === e.id) { exists = true; }
      });

      if (!exists) {
        this.edges.push(edge);
      }

      if (!(edge.source.id in this.adjacency)) {
        this.adjacency[edge.source.id] = {};
      }
      if (!(edge.target.id in this.adjacency[edge.source.id])) {
        this.adjacency[edge.source.id][edge.target.id] = [];
      }

      exists = false;
      this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
        if (edge.id === e.id) { exists = true; }
      });

      if (!exists) {
        this.adjacency[edge.source.id][edge.target.id].push(edge);
      }

      this.notify();
      return edge;
    }

  /** / addEdges
    * @param {array} edges [[source.id, target.id, data], ...]
    */
    addEdges(...edges) {
      edges.forEach(e => {
        const node1 = this.nodeSet[e[0]];
        if (node1 == undefined) {
          throw new TypeError('invalid node name: ' + e[0]);
        }
        const node2 = this.nodeSet[e[1]];
        if (node2 == undefined) {
          throw new TypeError('invalid node name: ' + e[1]);
        }
        const attr = e[2];

        this.newEdge(node1, node2, attr);
      })
    }

  /** / newNode */
    newNode(data) {
      const node = new Node(this.nextNodeId++, data);
      this.addNode(node);
      return node;
    }

  /** / newEdge */
    newEdge(source, target, data) {
      const edge = new Edge(this.nextEdgeId++, source, target, data);
      this.addEdge(edge);
      return edge;
    }

  /** список ребер между node1 и node2 / getEdges */
    getEdges(node1, node2) {
      if (node1.id in this.adjacency && node2.id in this.adjacency[node1.id]) {
        return this.adjacency[node1.id][node2.id];
      }
      return [];
    }

  /** / removeNode */
    removeNode(node) {
      if (node.id in this.nodeSet) delete this.nodeSet[node.id];

      const index = this.nodes.findIndex(n => n.id === node.id);
      if (index > -1) this.nodes.splice(index, 1);

      this.detachNode(node);
    }

  /** / detachNode */
    detachNode(node) {
      const tmpEdges = this.edges.slice();
      tmpEdges.forEach(e => {
        if (e.source.id === node.id || e.target.id === node.id) {
          this.removeEdge(e);
        }
      }, this);

      this.notify();
    }

  /** / removeEdge */
    removeEdge(edge) {
      const index = this.edges.findIndex(n => n.id === edge.id);
      if (index > -1) this.edges.splice(index, 1);

      for (const x in this.adjacency) {
        for (const y in this.adjacency[x]) {
          const edges = this.adjacency[x][y];

          for (let j = edges.length - 1; j >= 0; j--) {
            if (this.adjacency[x][y][j].id === edge.id) {
              this.adjacency[x][y].splice(j, 1);
            }
          }

          // Clean up empty edge arrays
          if (this.adjacency[x][y].length == 0) {
            delete this.adjacency[x][y];
          }
        }

        // Clean up empty objects
        if (Obj.empty(this.adjacency[x])) {
          delete this.adjacency[x];
        }
      }

      this.notify();
    }

  /**  / merge
    * @param {object} data {nodes:[{id, data}], edges:[{from, to, type, directed, data}]}
    */
    merge(data) {
      const nodes = [];
      data.nodes.forEach(n => {
        nodes.push(this.addNode(new Node(n.id, n.data)));
      });

      data.edges.forEach(e => {
        const from = nodes[e.from];
        const to = nodes[e.to];

        var id = (e.directed)
          ? (id = e.type + '-' + from.id + '-' + to.id)
          : (from.id < to.id) // normalise id for non-directed edges
            ? e.type + '-' + from.id + '-' + to.id
            : e.type + '-' + to.id + '-' + from.id;

        const edge = this.addEdge(new Edge(id, from, to, e.data));
        edge.data.type = e.type;
      });
    }

  /** / filterNodes */
    filterNodes(fn) {
      const tmpNodes = this.nodes.slice();
      tmpNodes.forEach(function(n) {
        if (!fn(n)) {
          this.removeNode(n);
        }
      }, this);
    }

  /** / filterEdges */
    filterEdges(fn) {
      const tmpEdges = this.edges.slice();
      tmpEdges.forEach(e => {
        if (!fn(e)) {
          this.removeEdge(e);
        }
      });
    }

  /** / addGraphListener */
    addGraphListener(obj) {
      this.eventListeners.push(obj);
    }

  /** / notify */
    notify() {
      this.eventListeners.forEach(obj => obj.graphChanged());
    }

  /** */
    loadOBJ(json) {
      const graph = new Graph();
      if ('nodes' in json || 'edges' in json) {
        this.addNodes(...json.nodes);
        this.addEdges(...json.edges);
      }
    }

  /** / json @static */
    static obj(json) {
      const graph = new Graph();
      graph.loadOBJ(json);
      return graph;
    }
}
