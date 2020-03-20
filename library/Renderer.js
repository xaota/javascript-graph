/** {Renderer} Рисование графа @class @export @default
  *
  */
  export default class Renderer {
  /** {Render} Создание объекта для рисования графа @constructor
    * @param onRenderStop optional callback function that gets executed whenever rendering stops.
    * @param onRenderStart optional callback function that gets executed whenever rendering starts.
    * @param onRenderFrame optional callback function that gets executed after each frame is rendered.
    */
    constructor(layout, clear, drawEdge, drawNode, onRenderStop, onRenderStart, onRenderFrame) {
      this.layout = layout;
      this.clear = clear;
      this.drawEdge = drawEdge;
      this.drawNode = drawNode;
      this.onRenderStop = onRenderStop;
      this.onRenderStart = onRenderStart;
      this.onRenderFrame = onRenderFrame;

      this.layout.graph.addGraphListener(this);
    }

  /** / graphChanged */
    graphChanged = function(e) {
      this.start();
    }

    /** / start
     * Starts the simulation of the layout in use.
     *
     * Note that in case the algorithm is still or already running then the layout that's in use
     * might silently ignore the call, and your optional <code>done</code> callback is never executed.
     * At least the built-in ForceDirected layout behaves in this way.
     *
     * @param {function} done An optional callback function that gets executed when the springy algorithm stops, either because it ended or because stop() was called.
     */
    start(done) {
      var t = this;
      this.layout.start(function() {
        t.clear();

        t.layout.eachEdge(function(edge, spring) {
          t.drawEdge(edge, spring.point1.position, spring.point2.position);
        });

        t.layout.eachNode(function(node, point) {
          t.drawNode(node, point.position);
        });

        if (t.onRenderFrame !== undefined) { t.onRenderFrame(); }
      }, this.onRenderStop, this.onRenderStart);
    }

  /** / stop */
    stop() {
      this.layout.stop();
    }
  }
