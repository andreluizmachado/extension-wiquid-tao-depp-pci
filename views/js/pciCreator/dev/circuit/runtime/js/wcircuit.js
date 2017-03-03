define(['IMSGlobal/jquery_2_1_1', 
    'lodash',
    'OAT/util/html'], function($, _,html) {

    function displaycircuit(id, $container, config) {

        //Instructions 
        $container.find("#fermer").click(function(event) {
            $container.find("#wrapinstruct").hide();
        });

        $container.find("#btinst").click(function(event) {
            $container.find("#wrapinstruct").show();
        });

        // Component
        // The parent class for all components 

        function component() {
            this.name = null;
            this.drawing = null;
            this.grabBox = null;
            this.active = false;
            this.removedFromToolbar = null;
            this.onFirstPlacement = null;
            this.label = null;
            this.wires = null;
            this.width = 60;
            this.height = 60;
            this.myPoints = null;
            this.isRotated = false;
            this.labelRotateMove = { x: 10, y: 10 };

            this.draw = function(x, y) {
                this.myPoints = [];
                this.wires = [];
                this.drawing = paper.set();
                this.grabBox = paper.rect(0, 0, this.width, this.height);
                this.grabBox.attr({ "fill": "#F00", "opacity": "0" });
                this.grabBox.drag(this.dragMove, this.dragStart, this.dragStop);
                $(this.grabBox.node).hover(this.hoverIn, this.hoverOut);
                this.grabBox.node.parent = this.grabBox;
                this.grabBox.obj = this;
                this.drawme(); // do specific drawing
                this.grabBox.toFront();
                this.translate(x, y);
            };

            this.hoverIn = function() {
                this.parent.obj.drawing.attr(symbolStyle.linesOver);
            };

            this.hoverOut = function() {
                this.parent.obj.drawing.attr(symbolStyle.lines);
            };

            this.dragStart = function() {
                this.ox = this.attr("x");
                this.oy = this.attr("y");
                this.obj.dx = 0; // to check if we've moved at all.  if not, rotate on mouse release!
                this.obj.dy = 0;
                this.prev_dx = 0;
                this.prev_dy = 0;
                //this.obj.dragWiresStart();
            };

            this.dragMove = function(dx, dy) {
                var topBound = 0;
                if (this.obj.active) {
                    topBound = toolbarheight;
                }
                if (this.ox + dx < 0) { dx = 0 - this.ox; } // left
                if (this.ox + dx + this.obj.width > paperSize.w) { dx = paperSize.w - this.obj.width - this.ox; } // right bound
                if (this.oy + dy < topBound) { dy = topBound - this.oy; } // top bound
                if (this.oy + dy + this.obj.height > paperSize.h) { dy = paperSize.h - this.obj.height - this.oy; } // bottom bound

                this.obj.translate(dx - this.prev_dx, dy - this.prev_dy);
                //this.obj.dragWires(dx,dy);
                this.obj.dx = dx; // to check if
                this.obj.dy = dy;
                this.prev_dx = dx;
                this.prev_dy = dy;

                this.obj.rotcx = this.attr("x") + 30; // grabbox is what we want, so this is appropriate
                this.obj.rotcy = this.attr("y") + 30;

                this.obj.updatePoints();
            };

            this.dragStop = function() {
                $container.find("#answcircuit").append(" " + this.obj.name + ",");
                if (this.obj.dx === 0 && this.obj.dy === 0 && this.obj.active) {
                    this.obj.rotate();
                }

                if (this.obj.removedFromToolbar !== null) {
                    if (this.obj.removedFromToolbar(this.obj, this.attr("x"), this.attr("y"))) {
                        this.obj.active = true;
                        if (this.obj.onFirstPlacement !== null) {
                            this.obj.onFirstPlacement();
                        }
                    }
                }
                if (this.obj) { // check because wires kill their "this"s
                    this.obj.updatePoints(); // for wire end snapping
                }
            };

            this.rotate = function() {
                // rotcy and rotcy were here.... (now see dragMove)
                if (this.isRotated) {
                    this.drawing.rotate(0, this.rotcx, this.rotcy);
                    this.isRotated = false;
                    this.label.translate(0 - this.labelRotateMove.x, 0 - this.labelRotateMove.y);
                    if (this.drawing[1].attrs.text) {
                        this.drawing[1].translate(-5, -5);
                    }
                    // start Position
                } else {
                    this.drawing.rotate(90, this.rotcx, this.rotcy);
                    // M Special rotation and repositionning

                    if (this.drawing[1].attrs.text) {
                        this.drawing[1].rotate(0, this.rotcx, this.rotcy);
                        this.drawing[1].translate(5, 5);
                    }

                    //this.rotatePoints(90,rotcx,rotcy);     // now being done in dragStop by updatePoints()...
                    this.isRotated = true;
                    this.label.translate(this.labelRotateMove.x, this.labelRotateMove.y);
                }
                //this.redrawWires();
            };

            this.translate = function(x, y) {
                this.grabBox.translate(x, y);
                this.drawing.translate(x, y);
                if (this.label) this.label.translate(x, y);
            };


            this.moveto = function(x, y) {
                x = x - this.grabBox.attr("x");
                y = y - this.grabBox.attr("y");
                this.translate(x, y);
            };

            this.makePoint = function(x, y) {
                var point = new Point(this, x, y);
                this.myPoints.push(point); // store locally
                points.push(point); // store globally
                return point.p;
            };

            this.updatePoints = function() {
                for (i = 0; i < this.myPoints.length; i++) {
                    this.myPoints[i].update(this.isRotated, { x: this.rotcx, y: this.rotcy });
                }
            };

            // NOTE: at creation, just notifyUnsnapped() was going to be used by the dot component
            this.notifySnapped = function(wireEnd) {};
            this.notifyUnsnapped = function(wireEnd) {};
        }


        // point class - represents the connection point(s) of a component
        function Point(obj, x, y) {
            this.obj = obj; // owner component
            this.p = paper.circle(x, y, 1).attr({ "opacity": "0" });
            this.x = x;
            this.y = y;
            this.wireEnds = [];

            // must be called after doing a translation of any sort to update x,y
            this.update = function(rotated, origin) {
                this.x = this.p.attr("cx");
                this.y = this.p.attr("cy");


                if (rotated) {
                    this.rotate(origin);
                }
                // update the wires
                for (var i = 0; i < this.wireEnds.length; i++) {
                    this.wireEnds[i].goto(this.x, this.y);
                }
            };

            // Called when object is rotated or after a translation (drag) while rotated.
            // Sadly, Raphael just does a rotation translation and there is no way to
            // get the translated coordinates.  So we must calculate them manually.
            this.rotate = function(origin) {
                costheta = Math.cos(90 * Math.PI / 180); // always a 90 degree rotation
                sintheta = Math.sin(90 * Math.PI / 180);
                x = this.x - origin.x;
                y = this.y - origin.y;
                this.x = (x * costheta) - (y * sintheta) + origin.x;
                this.y = (x * sintheta) + (y * costheta) + origin.y;
            };

            // called by wires to add themselves
            this.addWireEnd = function(w) {
                this.wireEnds.push(w);
            };

            // called by wires to remove themselves
            this.removeWireEnd = function(w) {
                for (var i = 0; i < this.wireEnds.length; i++) {
                    if (this.wireEnds[i] === w) {
                        this.wireEnds.splice(i, 1);
                        break;
                    }
                }
            };


            // right now, just called by the "point" component's isConnected()
            this.isConnected = function() {
                if (this.wireEnds.length > 0) {
                    return true;
                }
                return false;
            };
        }

        // Wire
        wire = function(n) {
            this.name = "Fil électr. " + n;
        };
        wire.prototype = new component();

        wire.prototype.drawme = function() {
            this.label = paper.text(30, 10, this.name).attr(symbolStyle.label);
            this.a = paper.circle(10, 30, symbolStyle.wire.endSize);
            this.b = paper.circle(50, 30, symbolStyle.wire.endSize);
            this.a.attr(symbolStyle.wire.end);
            this.b.attr(symbolStyle.wire.end);
            this.line = paper.path();
            this.drawLine();
            this.line.attr(symbolStyle.wire.line);
            this.a.toFront();
            this.b.toFront();
            this.a.obj = this.b.obj = this;
            this.a.drag(this.wireDragMove, this.wireDragStart, this.wireDragStop);
            this.b.drag(this.wireDragMove, this.wireDragStart, this.wireDragStop);
            this.a.node.parent = this.a;
            this.b.node.parent = this.b;
            $(this.a.node).hover(this.wireHoverIn, this.wireHoverOut);
            $(this.b.node).hover(this.wireHoverIn, this.wireHoverOut);
            this.a.snapped = false;
            this.b.snapped = false;
            this.a.snappedObj = null;
            this.b.snappedObj = null;
            this.a.goto = this.b.goto = this.wireEndGoto;
            this.a.componentDragMove = this.b.componentDragMove = this.componentDragMove;
            this.a.componentDragStart = this.b.componentDragStart = this.componentDragStart;
            this.drawing.push(this.a, this.b, this.line);
        };

        wire.prototype.wireHoverIn = function() {
            if (this.parent.snapped) {
                this.parent.attr(symbolStyle.wire.endSnappedOver);
            } else {
                this.parent.attr(symbolStyle.wire.endOver);
            }
        };

        wire.prototype.wireHoverOut = function() {
            if (this.parent.snapped) {
                this.parent.attr(symbolStyle.wire.endSnapped);
            } else {
                this.parent.attr(symbolStyle.wire.end);
            }
        };

        wire.prototype.onFirstPlacement = function() {
            //after drag, reset all styles:
            this.a.attr(symbolStyle.wire.end);
            this.b.attr(symbolStyle.wire.end);
            this.line.attr(symbolStyle.wire.line);
            this.grabBox.remove();
            this.label.remove();
        };

        // drag wire end functions
        wire.prototype.wireDragStart = function() {
            this.ox = this.attr("cx");
            this.oy = this.attr("cy");
            this.osnappedObj = this.snappedObj;
            this.osnappedPoint = this.snappedPoint;
            this.toFront();
        };

        wire.prototype.wireDragMove = function(dx, dy) {
            var s = pointSnapping;
            var x = this.ox + dx;
            var y = this.oy + dy;
            // component snap-to-point
            this.snapped = false;
            this.snappedObj = null; // stop, why are you about to delete this line?
            this.snappedPoint = null;
            for (var i = 0; i < points.length; i++) {
                px = points[i].x;
                py = points[i].y;
                if (x < px + s && x > px - s && y < py + s && y > py - s) {
                    this.snapped = true;
                    this.snappedObj = points[i].obj;
                    this.snappedPoint = points[i];
                    this.attr(symbolStyle.wire.endSnappedOver);
                    x = px;
                    y = py;
                }
            }
            // bounds checking if not snapped
            if (!this.snapped) {
                r = symbolStyle.wire.endSize;
                if (x - r < 0) { x = r; } // left
                if (x + r > paperSize.w) { x = paperSize.w - r; } // right
                if (y - r < toolbarheight) { y = toolbarheight + r; } // top
                if (y + r > paperSize.h) { y = paperSize.h - r; } // bottom
            }
            this.attr({ cx: x, cy: y });
            this.obj.drawLine();
        };

        wire.prototype.wireDragStop = function() {
            if (this.snapped) {
                this.snappedPoint.addWireEnd(this);
                this.attr(symbolStyle.wire.endSnapped);
                this.snappedObj.notifySnapped(this);
            }
            if (this.snappedObj !== this.osnappedObj && this.osnappedObj) {
                this.osnappedPoint.removeWireEnd(this);
                this.osnappedObj.notifyUnsnapped(this);
            }
        };

        wire.prototype.drawLine = function() {
            this.line.attr({ path: "M" + this.a.attr("cx") + "," + this.a.attr("cy") + "L" + this.b.attr("cx") + "," + this.b.attr("cy") });
        };


        // always called as a member of a wire end as "goto()"
        wire.prototype.wireEndGoto = function(x, y) {
            this.attr("cx", x);
            this.attr("cy", y);
            this.obj.drawLine();
        };

        // Resistor

        resistor = function(n) {
            this.name = "Resistance" + n;
        };
        resistor.prototype = new component();

        resistor.prototype.drawme = function() {
            this.drawing.push(
                paper.path("m 14,13.362127 33,0 0,21 -33,0 z m 32.91032,10.561385 12.094704,-0.0625 m -57.0104405,0.108259 12.0322025,0").attr(symbolStyle.lines),

                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 50;
            this.labelRotateMove.y = -25;
        };

        // coton 

        coton = function(n) {
            this.name = "Coton" + n;
        };
        coton.prototype = new component();

        coton.prototype.drawme = function() {
            this.drawing.push(
                paper.path("m 14,13.362127 33,0 0,21 -33,0 z m 32.91032,10.561385 12.094704,-0.0625 m -57.0104405,0.108259 12.0322025,0").attr(symbolStyle.lines),

                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 40;
            this.labelRotateMove.y = -25;
        };

        // aluminium 
        aluminium = function(n) {
            this.name = "Aluminium" + n;
        };
        aluminium.prototype = new component();

        aluminium.prototype.drawme = function() {
            this.drawing.push(
                paper.path("m 14,13.362127 33,0 0,21 -33,0 z m 32.91032,10.561385 12.094704,-0.0625 m -57.0104405,0.108259 12.0322025,0").attr(symbolStyle.lines),

                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 50;
            this.labelRotateMove.y = -25;
        };
        // arbitrary point

        dot = function(n) {
            this.name = "Soudure " + n;
        };
        dot.prototype = new component();

        dot.prototype.drawme = function() {
            this.drawing.push(
                this.makePoint(30, 35).attr(symbolStyle.dot.normal), // do first so the dot is in front of it for appearances sake
                paper.circle(30, 35, 15).attr(symbolStyle.dot.normal)
            );
            this.label = paper.text(30, 10, this.name).attr(symbolStyle.label);
        };

        dot.prototype.hoverIn = function() {
            this.parent.obj.drawing.attr(symbolStyle.dot.over);
        };

        dot.prototype.hoverOut = function() {
            this.parent.obj.normalStyle();
        };

        dot.prototype.onFirstPlacement = function() {
            this.label.remove();
        };



        dot.prototype.normalStyle = function() {
            if (this.isConnected()) {
                this.drawing.attr(symbolStyle.dot.connected);
            } else {
                this.drawing.attr(symbolStyle.dot.normal);
            }
        };


        // override stub function
        dot.prototype.notifyUnsnapped = function() {
            this.normalStyle();
        };

        dot.prototype.isConnected = function() {
            for (var i = 0; i < this.myPoints.length; i++) {
                if (this.myPoints[i].isConnected()) {
                    return true;
                }
            }
            return false;
        };
        // Battery

        battery = function(n) {
            this.name = "Pile " + n;
        };
        battery.prototype = new component();

        battery.prototype.drawme = function() {

            this.drawing.push(
                paper.path("m 33.175576,16.601219 0,14 m 2,-13.996588 0,14 m 4.064011,-21.6760759 8.699083,0 m -33.249252,-5.310957 0,10.4398249 m -5.2703778,-5.2199059 10.5407708,0 m 12.311795,14.6157609 28.149817,0 M 26.889725,5.4637385 26.799576,40.820901 M 2.088171,23 l 25.739104,0").attr(symbolStyle.lines),




                this.makePoint(2, 23),
                this.makePoint(59, 23.5)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 50;
            this.labelRotateMove.y = -25;

        };

        // lampe

        lampe = function(n) {
            this.name = "Lampe " + n;
        };
        lampe.prototype = new component();

        lampe.prototype.drawme = function() {

            this.drawing.push(
                paper.path("m 20,38.3621 c 20,-26 20,-26 20,-26 m -20,0 c 20,25 20,25 20,25 M 46.159664,25.362101 A 16.588236,16.588236 0 0 1 29.571428,41.950336 16.588236,16.588236 0 0 1 12.983192,25.362101 16.588236,16.588236 0 0 1 29.571428,8.7738647 16.588236,16.588236 0 0 1 46.159664,25.362101 Z M 59,23 47,23 M 13,24 2,24").attr(symbolStyle.lines),
                this.makePoint(2, 24),
                this.makePoint(59, 23)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 45;
            this.labelRotateMove.y = -25;
        };

        // moteur

        moteur = function(n) {
            this.name = "Moteur " + n;
            this.jpname = "moteur";
        };
        moteur.prototype = new component();

        moteur.prototype.drawme = function() {

            var moteurletter = paper.text(29, 25, "M");

            this.drawing.push(
                paper.path("m 46.159664,25.362101 c -10e-7,9.161429 -7.426807,16.588235 -16.588236,16.588235 -9.161429,0 -16.588235,-7.426806 -16.588236,-16.588235 0,-9.16143 7.426806,-16.5882363 16.588236,-16.5882363 9.16143,0 16.588236,7.4268063 16.588236,16.5882363 z M 59,23 47,23 M 13,24 2,24").attr(symbolStyle.lines),
                moteurletter.attr(symbolStyle.moteur),
                this.makePoint(2, 24),
                this.makePoint(59, 23)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 50;
            this.labelRotateMove.y = -25;
        };

        // Generateur
        generateur = function(n) {
            this.name = "Generateur " + n;
            this.jpname = "generateur";
        };
        generateur.prototype = new component();

        generateur.prototype.drawme = function() {

            var generateurletter = paper.text(29, 25, "G").attr({ 'font-size': 20 });


            this.drawing.push(
                paper.path("m 55.873731,17.298994 -6.611042,0 m -39.3889576,0 -6.611042,0 m 3.305521,-3.305521 0,6.611041 m 39.5914536,4.757587 c -10e-7,9.161429 -7.426807,16.588235 -16.588236,16.588235 -9.161429,0 -16.588235,-7.426806 -16.588236,-16.588235 0,-9.16143 7.426806,-16.5882363 16.588236,-16.5882363 9.16143,0 16.588236,7.4268063 16.588236,16.5882363 z M 59,23 47,23 M 13,24 2,24").attr(symbolStyle.lines),
                generateurletter.attr(symbolStyle.generateur),
                this.makePoint(2, 24),
                this.makePoint(59, 23)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 55;
            this.labelRotateMove.y = -25;
        };

        // diode

        diode = function(n) {
            this.name = "D.E.L. " + n;
        };
        diode.prototype = new component();

        diode.prototype.drawme = function() {

            this.drawing.push(
                paper.path("m 38.03532,23.861012 c 20.969704,0 20.969704,0 20.969704,0 M 1.9945835,23.969271 c 13.3447025,0 13.3447025,0 13.3447025,0 m 1.09312,0.133929 21.467144,-12.097138 0,24.194276 z M 15.410161,13.583009 c 0,21.753247 0,21.753247 0,21.753247").attr(symbolStyle.lines),
                paper.path("m 24.508645,9.7951768 c 3.76333,5.0177732 3.76333,5.0177732 3.76333,5.0177732 m -9.331502,-3.280158 c 3.763329,5.017772 3.763329,5.017772 3.763329,5.017772").attr(symbolStyle.lines),
                paper.path("m 23.886548,9.0595246 0.218776,1.0069834 0.718077,-0.5778135 z m -5.669341,1.5802124 0.166211,1.016984 0.747103,-0.539765 z").attr(symbolStyle.lines),
                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 30;
        };

        // interrupOuvert
        interrupOuvert = function(n) {
            this.name = "Int.Ouvert. " + n;
        };
        interrupOuvert.prototype = new component();

        interrupOuvert.prototype.drawme = function() {

            this.drawing.push(
                paper.path("m 20.616239,23.529651 12.046609,-12.3125 m 7.344249,12.741402 19.058092,0 m -57.258105,0.01072 18.157201,0").attr(symbolStyle.lines),
                paper.circle(20.56, 23.98, 4).attr(symbolStyle.lines).attr("fill", "fff"),
                paper.circle(40.56, 23.98, 4).attr(symbolStyle.lines).attr("fill", "fff"),
                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 45;
        };

        // interrupFerme
        interrupFerme = function(n) {
            this.name = "Int.Fermé " + n;
        };
        interrupFerme.prototype = new component();

        interrupFerme.prototype.drawme = function() {

            this.drawing.push(
                paper.path("m 1.9945835,23.969271 57.1572025,0").attr(symbolStyle.lines),
                paper.circle(20.56, 23.98, 4).attr(symbolStyle.lines).attr("fill", "fff"),
                paper.circle(40.56, 23.98, 4).attr(symbolStyle.lines).attr("fill", "fff"),
                this.makePoint(2, 24),
                this.makePoint(59, 24)
            );
            this.label = paper.text(30, 50, this.name).attr(symbolStyle.label);
            this.labelRotateMove.x = 40;
        };

        function showtoolbar(width) {
            var margin = 5;
            var toolsize = 60;
            var toolx = margin; // where to put the next tool in the x dimension

            // bottom border:
            paper.rect(0, 0, width, toolbarheight).attr({ fill: "#888", "stroke-width": 0 });
            paper.path("M 0 " + toolbarheight + " L " + width + " " + toolbarheight).attr({ stroke: "#222", "stroke-width": 2 });

            // draw a box with a tool/component inside
            function toolbox(component) {
                // draw the thing
                paper.rect(toolx, margin, toolsize, toolsize, 10).attr({ fill: "#666", "stroke-width": 0 });

                var newtool = function(x, y, num) {
                    var t = new component(num);
                    t.draw(x, y);
                    t.removedFromToolbar = function(obj, dropx, dropy) {
                        if (dropy > toolbarheight) {
                            newtool(x, y, num + 1);
                            t.removedFromToolbar = null;
                            return true;
                        } else {
                            obj.moveto(x, y);
                            return false;
                        }
                    };
                };
                newtool(toolx, margin, 1);

                toolx += toolsize + margin;
            }

            toolbox(resistor);
            toolbox(coton);
            toolbox(aluminium);
            toolbox(battery);
            toolbox(lampe);
            toolbox(moteur);
            toolbox(generateur);
            toolbox(diode);
            toolbox(interrupOuvert);
            toolbox(interrupFerme);
            toolbox(wire);
            toolbox(dot);

            return toolbarheight;
        }


        // Settings
        // ===========================================================================

        var paperSize; // store paper size
        var paper;
        var points = []; // array of point objects with x,y,obj
        var pointSnapping = 10;
        var toolbarheight = 71;
        var symbolStyle = {
            lines: { stroke: "#FFF", "stroke-width": 2 },
            linesOver: { stroke: "#F90" },
            moteur: { fill: "#FFF", "font-family": "\"arial\", cursive, sans-serif", "font-size": "20px" },
            generateur: { fill: "#FFF", "font-family": "\"arial\", cursive, sans-serif", "font-size": "20px" },
            label: { fill: "#FFF", "font-family": "\"arial\", cursive, sans-serif" },
            wire: {
                endSize: 7,
                end: { opacity: 1, fill: "#FFF", stroke: "#FFF", "stroke-width": 2 },
                endOver: { opacity: 1, fill: "#C0C" },
                endSnapped: { opacity: 0 },
                endSnappedOver: { opacity: 1, fill: "#690" },
                line: { stroke: "#FFF", "stroke-width": 2 }
            },
            dot: {
                normal: { "stroke-width": 2, "fill-opacity": 0, stroke: "#FFF", opacity: 1 },
                over: { stroke: "#F90", opacity: 1 },
                connected: { opacity: 0 }
            }
        };


        // Startup - jQuery will run when page has loaded
        // ===========================================================================

        // get the size of the #simspace area
        paperSize = { w: parseInt($container.find(".simspace").width()), h: parseInt($container.find(".simspace").height()) };

        // create Raphael paper for display!
        var idcanvas = _.uniqueId('idCanvas_');// lodash generate unique id
        $container.find('.simspace').attr('id',idcanvas);

        paper = Raphael(idcanvas, paperSize.w, paperSize.h);

        // show the toolbar and store its height for bounding
        paperSize.topbounds = showtoolbar(paperSize.w);



        // Circuit Logic
        // ===========================================================================

    } // close displaycircuit

    return {
        render: function(id, container, config) {
            var $container = $(container);
            
            displaycircuit(id, $container, config);
        }

    };
}); // close define.
