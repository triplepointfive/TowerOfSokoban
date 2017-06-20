(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ex = (typeof window !== "undefined" ? window['ex'] : typeof global !== "undefined" ? global['ex'] : null);
const resources_1 = require("./resources");
const menu_1 = require("./menu");
class Cell extends ex.Actor {
    constructor(x, y, texture) {
        super(x * Cell.size, y * Cell.size, Cell.size, Cell.size);
        this.texture = texture;
        this.origin = new ex.Vector(x, y);
        this.gridPos = new ex.Vector(x, y);
    }
    onInitialize(engine) {
        this.addDrawing(this.texture);
    }
    moveToOrigin() {
        this.pos = this.origin.scale(Cell.size);
        this.gridPos = this.origin.clone();
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
class MovableCell extends Cell {
    move(dx, dy) {
        this.pos.x += dx * Cell.size;
        this.pos.y += dy * Cell.size;
        this.gridPos.x += dx;
        this.gridPos.y += dy;
    }
}
class Box extends MovableCell {
    constructor(x, y) { super(x, y, resources_1.resouces.txCrate); }
}
class Player extends MovableCell {
    constructor(level, x, y) {
        super(x, y, resources_1.resouces.txPlayer);
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
        const delta = new ex.Vector(dx, dy);
        let cell = this.level.obsticleAt(this.gridPos.add(delta));
        if (cell instanceof Wall) {
            resources_1.resouces.sndOh.play();
            return;
        }
        else if (cell instanceof Box) {
            let nextCell = this.level.obsticleAt(this.gridPos.add(delta.scale(2)));
            if (nextCell === undefined) {
                cell.move(dx, dy);
                if (this.level.isHoleAt(this.gridPos.add(delta.scale(2)))) {
                    resources_1.resouces.sndFill.play();
                    this.level.closeHole();
                }
                else {
                    resources_1.resouces.sndDrag.play();
                }
            }
            else {
                resources_1.resouces.sndOh.play();
                return;
            }
        }
        else {
            resources_1.resouces.sndStep.play();
        }
        this.move(dx, dy);
    }
}
class Level extends ex.Scene {
    constructor(level) {
        super();
        this.boxes = [];
        this.holes = [];
        this.rawLevel = level.grid;
        const longestRow = Math.max.apply(null, this.rawLevel.map((row) => row.length));
        this.size = new ex.Vector(longestRow, this.rawLevel.length);
    }
    update(engine, delta) {
        super.update(engine, delta);
        if (engine.input.keyboard.wasPressed(ex.Input.Keys.R)) {
            this.reset();
        }
    }
    ;
    reset() {
        this.boxes.forEach((actor) => actor.moveToOrigin());
        this.player.moveToOrigin();
    }
    onInitialize(engine) {
        this.grid = new Array();
        for (let i = 0; i < this.size.y; i++) {
            this.grid[i] = new Array(this.size.x);
            for (let j = 0; j < this.size.x; j++) {
                switch (this.rawLevel[i][j]) {
                    case " ":
                        break;
                    case ".":
                        this.addGround(j, i);
                        break;
                    case "#":
                        let wall = new Wall(j, i);
                        this.add(wall);
                        this.grid[i][j] = wall;
                        break;
                    case "0":
                        let box = new Box(j, i);
                        this.addGround(j, i);
                        this.boxes.push(box);
                        this.add(box);
                        break;
                    case "^":
                        let hole = new Holder(j, i);
                        this.addGround(j, i);
                        this.holes.push(hole);
                        this.add(hole);
                        break;
                    case "@":
                        this.player = new Player(this, j, i);
                        this.add(this.player);
                        this.addGround(j, i);
                        break;
                }
            }
        }
        this.initCamera(engine);
        this.addUI(engine);
    }
    closeHole() {
        if (this.holes.every((hole) => this.isHoleClosed(hole))) {
            alert("You won!");
        }
    }
    obsticleAt(pos) {
        return this.grid[pos.y][pos.x] || this.boxes.find((box) => box.gridPos.equals(pos));
    }
    isHoleAt(pos) {
        return this.holes.some((hole) => hole.gridPos.equals(pos));
    }
    isHoleClosed(hole) {
        return !!this.obsticleAt(hole.gridPos);
    }
    initCamera(engine) {
        const camera = new ex.LockedCamera();
        const widthFactor = (engine.getDrawWidth() - 20) / this.size.x;
        const heightFactor = (engine.getDrawHeight() - 20) / this.size.y;
        camera.zoom(Math.min(widthFactor, heightFactor) / Cell.size);
        camera.move(new ex.Vector(this.size.x * Cell.size / 2 - Cell.size / 2, this.size.y * Cell.size / 2 - Cell.size / 2), 0);
        this.camera = camera;
    }
    addGround(i, j) {
        this.add(new Ground(i, j));
    }
    addUI(engine) {
        this.add(new LevelButtonWithImage(resources_1.resouces.uiGoToMenu, "MainMenu", 25, 25));
        this.add(new ResetLevelButton(this, 325, 25));
        this.add(new PlayerMoveButton(this.player, -1, 0, resources_1.resouces.uiLeft, 30, 600));
        this.add(new PlayerMoveButton(this.player, 0, 1, resources_1.resouces.uiDown, 130, 600));
        this.add(new PlayerMoveButton(this.player, 0, -1, resources_1.resouces.uiUp, 230, 600));
        this.add(new PlayerMoveButton(this.player, 1, 0, resources_1.resouces.uiRight, 325, 600));
    }
}
class ButtonWithImage extends menu_1.Button {
    constructor(drawing, onClick, x, y) {
        super(onClick, x, y, drawing.width);
        this.drawing = drawing;
    }
    onInitialize(engine) {
        super.onInitialize(engine);
        this.addDrawing(this.drawing);
    }
    draw(ctx, delta) {
        super.draw(ctx, delta);
        const w = this.drawing.width;
        ctx.beginPath();
        ctx.strokeStyle = ex.Color.White.toString();
        ctx.lineWidth = 3;
        ctx.arc(this.x + w / 2, this.y + w / 2, w, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
}
class PlayerMoveButton extends ButtonWithImage {
    constructor(player, dx, dy, drawing, x, y) {
        super(drawing, (engine) => { player.moveBy(dx, dy); }, x, y);
    }
}
class ResetLevelButton extends ButtonWithImage {
    constructor(level, x, y) {
        super(resources_1.resouces.uiReset, (engine) => { level.reset(); }, x, y);
    }
}
class LevelButtonWithImage extends ButtonWithImage {
    constructor(drawing, levelName, x, y) {
        super(drawing, (engine) => { engine.goToScene(levelName); }, x, y);
    }
}
let game = new ex.Engine({
    displayMode: ex.DisplayMode.FullScreen
});
game.setAntialiasing(true);
game.backgroundColor = ex.Color.DarkGray;
game.start(new resources_1.SokobanLoader()).then(() => {
    game.addScene("level0", new Level(resources_1.resouces.level0));
    game.addScene("level1", new Level(resources_1.resouces.level1));
    game.addScene("level1a", new Level(resources_1.resouces.level1a));
    game.addScene("level1b", new Level(resources_1.resouces.level1b));
    game.addScene("level2a", new Level(resources_1.resouces.level2a));
    game.addScene("level2b", new Level(resources_1.resouces.level2b));
    game.addScene("level3a", new Level(resources_1.resouces.level3a));
    game.addScene("level3b", new Level(resources_1.resouces.level3b));
    game.addScene("level4a", new Level(resources_1.resouces.level4a));
    game.addScene("level4b", new Level(resources_1.resouces.level4b));
    game.addScene("MainMenu", new menu_1.MainMenu());
    game.goToScene("MainMenu");
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./menu":2,"./resources":3}],2:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ex = (typeof window !== "undefined" ? window['ex'] : typeof global !== "undefined" ? global['ex'] : null);
const resources_1 = require("./resources");
class Button extends ex.UIActor {
    constructor(onClick, x, y, w) {
        super(x, y, w, w);
        this.onClick = onClick;
    }
    onInitialize(engine) {
        super.onInitialize(engine);
        this.on("pointerup", () => { this.onClick(engine); console.log("a"); });
    }
}
exports.Button = Button;
class LevelButton extends Button {
    constructor(levelName, x, y, w) {
        super((engine) => { engine.goToScene(levelName); }, x, y, w);
    }
}
exports.LevelButton = LevelButton;
class LevelButtonWithText extends LevelButton {
    constructor(name, levelName, x, y, w) {
        super(levelName, x, y, w);
        this.name = name;
    }
    draw(ctx, delta) {
        const rectWidth = 5;
        ctx.beginPath();
        ctx.fillStyle = ex.Color.White.toString();
        ctx.fillRect(this.pos.x, this.pos.y, this.getWidth(), this.getHeight());
        ctx.fillStyle = ex.Color.DarkGray.toString();
        ctx.fillRect(this.pos.x + rectWidth, this.pos.y + rectWidth, this.getWidth() - 2 * rectWidth, this.getHeight() - 2 * rectWidth);
        ctx.fillStyle = ex.Color.Black.toString();
        ctx.font = "30px serif";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.pos.x + this.getWidth() / 2, this.pos.y + this.getHeight() / 2 + 2 * rectWidth);
        ctx.closePath();
        ctx.fill();
    }
}
class TopLogo extends ex.UIActor {
    onInitialize(engine) {
        super.onInitialize(engine);
        this.addDrawing(resources_1.resouces.txLogo);
        this.pos.x += (engine.getDrawWidth() - resources_1.resouces.txLogo.width) / 2;
    }
}
class MainMenu extends ex.Scene {
    constructor() {
        super();
    }
    onInitialize(engine) {
        const w = engine.getDrawWidth();
        let h = engine.getDrawHeight();
        const topLogoHeight = h / 5;
        this.add(new TopLogo(0, topLogoHeight / 4, w, topLogoHeight / 2));
        h -= topLogoHeight;
        if (h / 17 < w / 9) {
            const size = h / 17;
            const offsetH = (w - size * 6) / 3;
            ["a", "b"].forEach((letter, j) => {
                [1, 2, 3, 4].forEach((num, i) => {
                    let button = new LevelButtonWithText(`${num}${letter}`, `level${num}${letter}`, offsetH * (1 + j) + size * 3 * j, topLogoHeight + (size * (1 + i * 4)), size * 3);
                    this.add(button);
                });
            });
        }
        else {
            // TODO: Implement wide screen's layout
        }
    }
}
exports.MainMenu = MainMenu;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./resources":3}],3:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ex = (typeof window !== "undefined" ? window['ex'] : typeof global !== "undefined" ? global['ex'] : null);
class SokobanLoader extends ex.Loader {
    constructor() {
        super();
        for (const key in exports.resouces) {
            this.addResource(exports.resouces[key]);
        }
    }
}
exports.SokobanLoader = SokobanLoader;
class LoadableLevel extends ex.Resource {
    constructor(path) { super(path, "text"); }
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
    txLogo: new ex.Texture("./images/logo.png"),
    uiGoToMenu: new ex.Texture("./images/log-in.svg"),
    uiReset: new ex.Texture("./images/refresh-cw.svg"),
    uiUp: new ex.Texture("./images/chevron-up.svg"),
    uiDown: new ex.Texture("./images/chevron-down.svg"),
    uiLeft: new ex.Texture("./images/chevron-left.svg"),
    uiRight: new ex.Texture("./images/chevron-right.svg"),
    sndOh: new ex.Sound("./sounds/oh.wav"),
    sndDrag: new ex.Sound("./sounds/drag.wav"),
    sndFill: new ex.Sound("./sounds/fill.wav"),
    sndStep: new ex.Sound("./sounds/step.wav"),
    level0: new LoadableLevel("./levels/0.txt"),
    level1: new LoadableLevel("./levels/1.txt"),
    level1a: new LoadableLevel("./levels/1a.txt"),
    level1b: new LoadableLevel("./levels/1b.txt"),
    level2a: new LoadableLevel("./levels/2a.txt"),
    level2b: new LoadableLevel("./levels/2b.txt"),
    level3a: new LoadableLevel("./levels/3a.txt"),
    level3b: new LoadableLevel("./levels/3b.txt"),
    level4a: new LoadableLevel("./levels/4a.txt"),
    level4b: new LoadableLevel("./levels/4b.txt")
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
