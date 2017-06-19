(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ex = (typeof window !== "undefined" ? window['ex'] : typeof global !== "undefined" ? global['ex'] : null);
const resources_1 = require("./resources");
const loader = new ex.Loader();
for (const key in resources_1.resouces) {
    loader.addResource(resources_1.resouces[key]);
}
class Cell extends ex.Actor {
    constructor(x, y, texture) {
        super(x * Cell.size, y * Cell.size, Cell.size, Cell.size);
        this.texture = texture;
    }
    onInitialize(engine) {
        this.addDrawing(this.texture);
    }
}
Cell.size = 64;
class Wall extends Cell {
    constructor(x, y) { super(x, y, resources_1.resouces.txWall); }
}
class Holder extends Cell {
    constructor(x, y) { super(x, y, resources_1.resouces.txEndPoint); }
}
class Ground extends Cell {
    constructor(x, y) { super(x, y, resources_1.resouces.txGround); }
    onInitialize(engine) {
        super.onInitialize(engine);
        this.setZIndex(-1);
    }
}
class Box extends Cell {
    constructor(x, y) { super(x, y, resources_1.resouces.txCrate); }
}
class Player extends Cell {
    constructor(level, gridX, gridY) {
        super(gridX, gridY, resources_1.resouces.txPlayer);
        this.gridX = gridX;
        this.gridY = gridY;
        this.level = level;
    }
    onInitialize(engine) {
        super.onInitialize(engine);
        this.setZIndex(1);
    }
    update(engine, delta) {
        super.update(engine, delta);
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.W) || engine.input.keyboard.wasPressed(ex.Input.Keys.Up)) {
            this.moveBy(0, -1);
        }
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.S) || engine.input.keyboard.wasPressed(ex.Input.Keys.Down)) {
            this.moveBy(0, 1);
        }
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.D) || engine.input.keyboard.wasPressed(ex.Input.Keys.Right)) {
            this.moveBy(1, 0);
        }
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.A) || engine.input.keyboard.wasPressed(ex.Input.Keys.Left)) {
            this.moveBy(-1, 0);
        }
    }
    moveBy(dx, dy) {
        let cell = this.level.grid[this.gridY + dy][this.gridX + dx];
        const delta = new ex.Vector(dx, dy).scale(Cell.size);
        if (cell instanceof Wall) {
            resources_1.resouces.sndOh.play();
            return;
        }
        if (cell instanceof Box) {
            let nextCell = this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx];
            if (nextCell === undefined) {
                resources_1.resouces.sndDrag.play();
                cell.pos = cell.pos.add(delta);
                this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
                this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = cell;
            }
            else if (nextCell instanceof Holder) {
                resources_1.resouces.sndFill.play();
                this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
                this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = undefined;
                cell.kill();
                nextCell.kill();
                this.level.closeHole();
            }
            else {
                resources_1.resouces.sndOh.play();
                return;
            }
        }
        else {
            resources_1.resouces.sndStep.play();
        }
        this.gridX += dx;
        this.gridY += dy;
        this.pos = this.pos.add(delta);
    }
}
class Level extends ex.Scene {
    constructor(level) {
        super();
        this.holes = 0;
        console.log(level);
        this.rawLevel = level.grid;
        const longestRow = Math.max.apply(null, this.rawLevel.map((row) => row.length));
        this.size = new ex.Vector(longestRow, this.rawLevel.length);
    }
    update(engine, delta) {
        super.update(engine, delta);
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.R)) {
            this.reset(engine);
        }
    }
    ;
    reset(engine) {
        this.children.forEach((actor) => actor.kill());
        this.grid = new Array();
        for (let i = 0; i < this.size.y; i++) {
            this.grid[i] = new Array(this.size.x);
            for (let j = 0; j < this.size.x; j++) {
                let cell = undefined;
                switch (this.rawLevel[i][j]) {
                    case " ":
                        break;
                    case ".":
                        this.addGround(j, i);
                        break;
                    case "#":
                        cell = new Wall(j, i);
                        this.addGround(j, i);
                        break;
                    case "0":
                        cell = new Box(j, i);
                        this.addGround(j, i);
                        break;
                    case "^":
                        cell = new Holder(j, i);
                        this.holes += 1;
                        this.addGround(j, i);
                        break;
                    case "@":
                        this.player = new Player(this, j, i);
                        // Player is not a part of a grid.
                        this.add(this.player);
                        this.addGround(j, i);
                        break;
                }
                if (cell) {
                    this.add(cell);
                    this.grid[i][j] = cell;
                }
            }
        }
    }
    onInitialize(engine) {
        this.reset(engine);
        this.initCamera(engine);
    }
    closeHole() {
        this.holes -= 1;
        if (this.holes === 0) {
            alert("You won!");
        }
    }
    initCamera(engine) {
        const camera = new ex.LockedCamera();
        const widthFactor = (engine.getDrawWidth() - 20) / this.size.x;
        const heightFactor = (engine.getDrawHeight() - 20) / this.size.y;
        // camera.zoom(Math.floor(Math.min(widthFactor, heightFactor) / Cell.size) || 1);
        camera.zoom(Math.min(widthFactor, heightFactor) / Cell.size);
        camera.move(new ex.Vector(this.size.x * Cell.size / 2 - Cell.size / 2, this.size.y * Cell.size / 2 - Cell.size / 2), 0);
        this.camera = camera;
    }
    addGround(i, j) {
        this.add(new Ground(i, j));
    }
}
let game = new ex.Engine({
    displayMode: ex.DisplayMode.FullScreen
});
game.setAntialiasing(true);
game.backgroundColor = ex.Color.DarkGray;
game.start(loader).then(function () {
    game.addScene("level1b", new Level(resources_1.resouces.level4a));
    game.goToScene("level1b");
});
const movePlayerBy = function (dx, dy) {
    if (game.currentScene instanceof Level) {
        game.currentScene.player.moveBy(dx, dy);
    }
};
["click", "touchstart"].forEach(function (action) {
    document.getElementById("control-left").addEventListener(action, function (event) {
        event.preventDefault();
        movePlayerBy(-1, 0);
    });
    document.getElementById("control-up").addEventListener(action, function (event) {
        event.preventDefault();
        movePlayerBy(0, -1);
    });
    document.getElementById("control-down").addEventListener(action, function (event) {
        event.preventDefault();
        movePlayerBy(0, 1);
    });
    document.getElementById("control-right").addEventListener(action, function (event) {
        event.preventDefault();
        movePlayerBy(1, 0);
    });
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./resources":2}],2:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ex = (typeof window !== "undefined" ? window['ex'] : typeof global !== "undefined" ? global['ex'] : null);
class LoadableLevel extends ex.Resource {
    processData(data) {
        this.grid = data.split(/\r?\n/);
    }
}
exports.LoadableLevel = LoadableLevel;
exports.resouces = {
    txWall: new ex.Texture("./images/Wall_Black.png"),
    txCrate: new ex.Texture("./images/Crate_Yellow.png"),
    txEndPoint: new ex.Texture("./images/EndPoint_Yellow.png"),
    txPlayer: new ex.Texture("./images/Character4.png"),
    txGround: new ex.Texture("./images/GroundGravel_Concrete.png"),
    sndOh: new ex.Sound("./sounds/oh.wav"),
    sndDrag: new ex.Sound("./sounds/drag.wav"),
    sndFill: new ex.Sound("./sounds/fill.wav"),
    sndStep: new ex.Sound("./sounds/step.wav"),
    level0: new LoadableLevel("./levels/0.txt", "text/plain"),
    level1a: new LoadableLevel("./levels/1a.txt", "text/plain"),
    level1b: new LoadableLevel("./levels/1b.txt", "text/plain"),
    level2a: new LoadableLevel("./levels/2a.txt", "text/plain"),
    level2b: new LoadableLevel("./levels/2b.txt", "text/plain"),
    level3a: new LoadableLevel("./levels/3a.txt", "text/plain"),
    level3b: new LoadableLevel("./levels/3b.txt", "text/plain"),
    level4a: new LoadableLevel("./levels/4a.txt", "text/plain"),
    level4b: new LoadableLevel("./levels/4b.txt", "text/plain")
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
