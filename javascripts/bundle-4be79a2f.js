(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const loader = new ex.Loader();
const txWall = new ex.Texture("./images/Wall_Black.png");
const txCrate = new ex.Texture("./images/Crate_Yellow.png");
const txEndPoint = new ex.Texture("./images/EndPoint_Yellow.png");
const txPlayer = new ex.Texture("./images/Character4.png");
const txGround = new ex.Texture("./images/GroundGravel_Concrete.png");
loader.addResource(txWall);
loader.addResource(txCrate);
loader.addResource(txEndPoint);
loader.addResource(txPlayer);
loader.addResource(txGround);
class Cell extends ex.Actor {
    constructor(x, y, color) {
        super(x * Cell.size, y * Cell.size, Cell.size, Cell.size, color);
    }
}
Cell.size = 64;
class Wall extends Cell {
    constructor(x, y) { super(x, y, ex.Color.Gray); }
    onInitialize(engine) {
        this.addDrawing(txWall);
    }
}
class Holder extends Cell {
    constructor(x, y) { super(x, y, ex.Color.Black); }
    onInitialize(engine) {
        this.addDrawing(txEndPoint);
    }
}
class Ground extends Cell {
    constructor(x, y) { super(x, y, ex.Color.Black); }
    onInitialize(engine) {
        this.setZIndex(-1);
        this.addDrawing(txGround);
    }
}
class Box extends Cell {
    constructor(x, y) { super(x, y, ex.Color.Orange); }
    onInitialize(engine) {
        this.addDrawing(txCrate);
    }
}
class Player extends Cell {
    constructor(level, gridX, gridY) {
        super(gridX, gridY, ex.Color.White);
        this.gridX = gridX;
        this.gridY = gridY;
        this.level = level;
    }
    onInitialize(engine) {
        this.setZIndex(1);
        this.addDrawing(txPlayer);
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
            return;
        }
        if (cell instanceof Box) {
            let nextCell = this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx];
            if (nextCell === undefined) {
                cell.pos = cell.pos.add(delta);
                this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
                this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = cell;
            }
            else if (nextCell instanceof Holder) {
                this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
                this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = undefined;
                cell.kill();
                nextCell.kill();
                this.level.closeHole();
            }
            else {
                return;
            }
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
        this.rawLevel = level;
    }
    onInitialize(engine) {
        // TODO: Count x as the longest row's length.
        this.size = new ex.Vector(this.rawLevel[0].length, this.rawLevel.length);
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
        let camera = new ex.LockedCamera();
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
    closeHole() {
        this.holes -= 1;
        if (this.holes === 0) {
            alert("You won!");
        }
    }
}
const simpleLevel = [
    "  ######",
    "  # ..@#",
    "  # 00 #",
    "  ## ###",
    "   # #  ",
    "   # #  ",
    "#### #  ",
    "#    ## ",
    "# #   # ",
    "#   # # ",
    "###   # ",
    "  ##### "
];
const level1a = [
    "######## ######",
    "# #@   ###    #",
    "#.## 00    0  #",
    "#.##  00# 0 0 #",
    "#.##    #     #",
    "#.#######0#####",
    "#.#    #      #",
    "#.######      #",
    "#  ....0000   #",
    "#  #####      #",
    "####   ########"
];
const level1b = [
    "######  ##### ",
    "#....#  #...# ",
    "#.0..####.0.# ",
    "#.0......0..# ",
    "#..###@###0.# ",
    "##########.###",
    "#..^^^.#.....#",
    "#..#####0....#",
    "##^#   #.0...#",
    " #^#####.0...#",
    " #..^^^^0.0..#",
    " #..##########",
    " ####         "
];
const level2a = [
    " ####                    ",
    "## @########             ",
    "#          #             ",
    "# 0#####0# #             ",
    "#  #   # 0 #             ",
    "# 0 0    0##             ",
    "# 0  0  #  #             ",
    "# ####0 ## #             ",
    "#  0   0 # ##            ",
    "# ###0#   0 #############",
    "#   #  0# 0 ............#",
    "#  0      ###############",
    "#####  #  #              ",
    "    #######              "
];
const level2b = [
    "###########                 ",
    "#    #    ###               ",
    "#  00#00   @#               ",
    "#     0   ###               ",
    "#    #    #                 ",
    "## #########                ",
    "#  0 #     #                ",
    "# 00 #0 0 0#                ",
    "#  0     0 #                ",
    "# 000#0  0 #################",
    "#    #  0 0 ...............#",
    "############################"
];
const level3a = [
    "  ########         ",
    "### #    #         ",
    "#   0    ###       ",
    "# # 00#00# #       ",
    "# 00#      #       ",
    "# #  0 #   #       ",
    "#    #0##0##       ",
    "#  00  0   #       ",
    "# ##   #   #       ",
    "#    #0#####       ",
    "###  0 ############",
    "  #  0@...........#",
    "  #################"
];
const level3b = [
    "##############     ",
    "#        #   #     ",
    "# 00  #00# # #     ",
    "#  # 0 0 #00 #     ",
    "## #  #  # # #     ",
    "#   ##       #     ",
    "#   # 0 #   ##     ",
    "# 0 #0 #   ###     ",
    "##0 #  ############",
    "#  0    ..........#",
    "#   # @############",
    "########           "
];
const level4a = [
    "#########################",
    "#@      ................#",
    "#       #################",
    "####### ######           ",
    " #           #           ",
    " # 0 0 0 0 0 #           ",
    "######## #####           ",
    "#   0 0  0 0 #           ",
    "#   0        #           ",
    "##### ########           ",
    " #  0 0 0   #            ",
    " #     0    #            ",
    " # 0 0   0 ##            ",
    "####### ####             ",
    "#  0     #               ",
    "#        #               ",
    "#   ######               ",
    "#####                    "
];
const level4b = [
    "  #############",
    "  #  .........#",
    "  #  .........#",
    "  #  ##########",
    "#### #    #####",
    "#  #0##  ##   #",
    "#     #### 0  #",
    "# 00  #  #  0 #",
    "##  00#   00 ##",
    " #0  0   #0  # ",
    " # 00 #  #  0# ",
    " # 0 0#### 0 # ",
    " #       #  ## ",
    " #### 0  # ##  ",
    "    ### ## #   ",
    "     # 0   #   ",
    "     #@ #  #   ",
    "     #######   "
];
let game = new ex.Engine({
    displayMode: ex.DisplayMode.FullScreen
});
game.setAntialiasing(true);
game.backgroundColor = ex.Color.DarkGray;
game.addScene("level1b", new Level(level1b));
game.goToScene("level1b");
game.start(loader);
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsTUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDekQsTUFBTSxPQUFPLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFDbEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDM0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7QUFFdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBRTdCLFVBQW9CLFNBQVEsRUFBRSxDQUFDLEtBQUs7SUFHbEMsWUFBWSxDQUFTLEVBQUUsQ0FBUyxFQUFFLEtBQWU7UUFDL0MsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuRSxDQUFDOztBQUplLFNBQUks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LEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9HLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRU0sTUFBTSxDQUFDLEVBQVUsRUFBRSxFQUFVO1FBQ2xDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM3RCxNQUFNLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckQsRUFBRSxDQUFDLENBQUMsSUFBSSxZQUFZLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDekIsTUFBTSxDQUFDO1FBQ1Qs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SSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLElBQUksR0FBUyxTQUFTLENBQUM7Z0JBRTNCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixLQUFLLEdBQUc7d0JBQ04sS0FBSyxDQUFDO29CQUNSLEtBQUssR0FBRzt3QkFDTixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxDQUFDO29CQUNSLEtBQUssR0FBRzt3QkFDTixJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxDQUFDO29CQUNSLEtBQUssR0FBRzt3QkFDTixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDckIsS0FBSyxDQUFDO29CQUNSLEtBQUssR0FBRzt3QkFDTixJQUFJLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQzt3QkFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3JCLEtBQUssQ0FBQztvQkFDUixLQUFLLEdBQUc7d0JBQ04sSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNyQyxrQ0FBa0M7d0JBQ2xDLElBQUksQ0FBQyxHQUFH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O0FBRUYsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsTUFBYztJQUV0RCxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxVQUFTLEtBQUs7UUFDN0UsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3ZCLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQVMsS0FBSztRQUMzRSxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdkIsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsVUFBUyxLQUFLO1FBQzdFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN2QixZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsVUFBUyxLQUFLO1FBQzlFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN2QixZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgbG9hZGVyID0gbmV3IGV4LkxvYWRlcigpO1xuXG5jb25zdCB0eFdhbGwgPSBuZXcgZXguVGV4dHVyZShcIi4vaW1hZ2VzL1dhbGxfQmxhY2sucG5nXCIpO1xuY29uc3QgdHhDcmF0ZSA9IG5ldyBleC5UZXh0dXJlKFwiLi9pbWFnZXMvQ3JhdGVfWWVsbG93LnBuZ1wiKTtcbmNvbnN0IHR4RW5kUG9pbnQgPSBuZXcgZXguVGV4dHVyZShcIi4vaW1hZ2VzL0VuZFBvaW50X1llbGxvdy5wbmdcIik7XG5jb25zdCB0eFBsYXllciA9IG5ldyBleC5UZXh0dXJlKFwiLi9pbWFnZXMvQ2hhcmFjdGVyNC5wbmdcIik7XG5jb25zdCB0eEdyb3VuZCA9IG5ldyBleC5UZXh0dXJlKFwiLi9pbWFnZXMvR3JvdW5kR3JhdmVsX0NvbmNyZXRlLnBuZ1wiKTtcblxubG9hZGVyLmFkZFJlc291cmNlKHR4V2FsbCk7XG5sb2FkZXIuYWRkUmVzb3VyY2UodHhDcmF0ZSk7XG5sb2FkZXIuYWRkUmVzb3VyY2UodHhFbmRQb2ludCk7XG5sb2FkZXIuYWRkUmVzb3VyY2UodHhQbGF5ZXIpO1xubG9hZGVyLmFkZFJlc291cmNlKHR4R3JvdW5kKTtcblxuYWJzdHJhY3QgY2xhc3MgQ2VsbCBleHRlbmRzIGV4LkFjdG9yIHtcbiAgc3RhdGljIHJlYWRvbmx5IHNpemU6IG51bWJlciA9IDY0O1xuXG4gIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCBjb2xvcjogZXguQ29sb3IpIHtcbiAgICBzdXBlcih4ICogQ2VsbC5zaXplLCB5ICogQ2VsbC5zaXplLCBDZWxsLnNpemUsIENlbGwuc2l6ZSwgY29sb3IpO1xuICB9XG59XG5cbmNsYXNzIFdhbGwgZXh0ZW5kcyBDZWxsIHtcbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIpIHsgc3VwZXIoeCwgeSwgZXguQ29sb3IuR3JheSk7IH1cblxuICBwdWJsaWMgb25Jbml0aWFsaXplKGVuZ2luZTogZXguRW5naW5lKTogdm9pZCB7XG4gICAgdGhpcy5hZGREcmF3aW5nKHR4V2FsbCk7XG4gIH1cbn1cblxuY2xhc3MgSG9sZGVyIGV4dGVuZHMgQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyKSB7IHN1cGVyKHgsIHksIGV4LkNvbG9yLkJsYWNrKTsgfVxuXG4gIHB1YmxpYyBvbkluaXRpYWxpemUoZW5naW5lOiBleC5FbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLmFkZERyYXdpbmcodHhFbmRQb2ludCk7XG4gIH1cbn1cblxuY2xhc3MgR3JvdW5kIGV4dGVuZHMgQ2VsbCB7XG4gIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyKSB7IHN1cGVyKHgsIHksIGV4LkNvbG9yLkJsYWNrKTsgfVxuXG4gIHB1YmxpYyBvbkluaXRpYWxpemUoZW5naW5lOiBleC5FbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLnNldFpJbmRleCgtMSk7XG4gICAgdGhpcy5hZGREcmF3aW5nKHR4R3JvdW5kKTtcbiAgfVxufVxuXG5jbGFzcyBCb3ggZXh0ZW5kcyBDZWxsIHtcbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIpIHsgc3VwZXIoeCwgeSwgZXguQ29sb3IuT3JhbmdlKTsgfVxuXG4gIHB1YmxpYyBvbkluaXRpYWxpemUoZW5naW5lOiBleC5FbmdpbmUpOiB2b2lkIHtcbiAgICB0aGlzLmFkZERyYXdpbmcodHhDcmF0ZSk7XG4gIH1cbn1cblxuY2xhc3MgUGxheWVyIGV4dGVuZHMgQ2VsbCB7XG4gIHByaXZhdGUgbGV2ZWw6IExldmVsO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsOiBMZXZlbCwgcHJpdmF0ZSBncmlkWDogbnVtYmVyLCBwcml2YXRlIGdyaWRZOiBudW1iZXIpIHtcbiAgICBzdXBlcihncmlkWCwgZ3JpZFksIGV4LkNvbG9yLldoaXRlKTtcblxuICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgfVxuXG4gIHB1YmxpYyBvbkluaXRpYWxpemUoZW5naW5lOiBleC5FbmdpbmUpIHtcbiAgICB0aGlzLnNldFpJbmRleCgxKTtcbiAgICB0aGlzLmFkZERyYXdpbmcodHhQbGF5ZXIpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZShlbmdpbmU6IGV4LkVuZ2luZSwgZGVsdGE6IG51bWJlcikge1xuICAgIHN1cGVyLnVwZGF0ZShlbmdpbmUsIGRlbHRhKTtcblxuICAgIGlmIChlbmdpbmUuaW5wdXQua2V5Ym9hcmQud2FzUHJlc3NlZChleC5JbnB1dC5LZXlzLlcpIHx8IGVuZ2luZS5pbnB1dC5rZXlib2FyZC53YXNQcmVzc2VkKGV4LklucHV0LktleXMuVXApKSB7XG4gICAgICB0aGlzLm1vdmVCeSgwLCAtMSk7XG4gICAgfVxuXG4gICAgaWYgKGVuZ2luZS5pbnB1dC5rZXlib2FyZC53YXNQcmVzc2VkKGV4LklucHV0LktleXMuUykgfHwgZW5naW5lLmlucHV0LmtleWJvYXJkLndhc1ByZXNzZWQoZXguSW5wdXQuS2V5cy5Eb3duKSkge1xuICAgICAgdGhpcy5tb3ZlQnkoMCwgMSk7XG4gICAgfVxuXG4gICAgaWYgKGVuZ2luZS5pbnB1dC5rZXlib2FyZC53YXNQcmVzc2VkKGV4LklucHV0LktleXMuRCkgfHwgZW5naW5lLmlucHV0LmtleWJvYXJkLndhc1ByZXNzZWQoZXguSW5wdXQuS2V5cy5SaWdodCkpIHtcbiAgICAgIHRoaXMubW92ZUJ5KDEsIDApO1xuICAgIH1cblxuICAgIGlmIChlbmdpbmUuaW5wdXQua2V5Ym9hcmQud2FzUHJlc3NlZChleC5JbnB1dC5LZXlzLkEpIHx8IGVuZ2luZS5pbnB1dC5rZXlib2FyZC53YXNQcmVzc2VkKGV4LklucHV0LktleXMuTGVmdCkpIHtcbiAgICAgIHRoaXMubW92ZUJ5KC0xLCAwKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbW92ZUJ5KGR4OiBudW1iZXIsIGR5OiBudW1iZXIpOiB2b2lkIHtcbiAgICBsZXQgY2VsbCA9IHRoaXMubGV2ZWwuZ3JpZFt0aGlzLmdyaWRZICsgZHldW3RoaXMuZ3JpZFggKyBkeF07XG4gICAgY29uc3QgZGVsdGEgPSBuZXcgZXguVmVjdG9yKGR4LCBkeSkuc2NhbGUoQ2VsbC5zaXplKTtcblxuICAgIGlmIChjZWxsIGluc3RhbmNlb2YgV2FsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjZWxsIGluc3RhbmNlb2YgQm94KSB7XG4gICAgICBsZXQgbmV4dENlbGwgPSB0aGlzLmxldmVsLmdyaWRbdGhpcy5ncmlkWSArIDIgKiBkeV1bdGhpcy5ncmlkWCArIDIgKiBkeF07XG4gICAgICBpZiAobmV4dENlbGwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjZWxsLnBvcyA9IGNlbGwucG9zLmFkZChkZWx0YSk7XG4gICAgICAgIHRoaXMubGV2ZWwuZ3JpZFt0aGlzLmdyaWRZICsgZHldW3RoaXMuZ3JpZFggKyBkeF0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMubGV2ZWwuZ3JpZFt0aGlzLmdyaWRZICsgMiAqIGR5XVt0aGlzLmdyaWRYICsgMiAqIGR4XSA9IGNlbGw7XG5cbiAgICAgIH0gZWxzZSBpZiAobmV4dENlbGwgaW5zdGFuY2VvZiBIb2xkZXIpIHtcbiAgICAgICAgdGhpcy5sZXZlbC5ncmlkW3RoaXMuZ3JpZFkgKyBkeV1bdGhpcy5ncmlkWCArIGR4XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5sZXZlbC5ncmlkW3RoaXMuZ3JpZFkgKyAyICogZHldW3RoaXMuZ3JpZFggKyAyICogZHhdID0gdW5kZWZpbmVkO1xuICAgICAgICBjZWxsLmtpbGwoKTtcbiAgICAgICAgbmV4dENlbGwua2lsbCgpO1xuICAgICAgICB0aGlzLmxldmVsLmNsb3NlSG9sZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZ3JpZFggKz0gZHg7XG4gICAgdGhpcy5ncmlkWSArPSBkeTtcbiAgICB0aGlzLnBvcyA9IHRoaXMucG9zLmFkZChkZWx0YSk7XG4gIH1cbn1cblxuY2xhc3MgTGV2ZWwgZXh0ZW5kcyBleC5TY2VuZSB7XG4gIHB1YmxpYyBwbGF5ZXI6IFBsYXllcjtcbiAgcHVibGljIGdyaWQ6IEFycmF5PEFycmF5PENlbGw+PjtcblxuICBwcml2YXRlIHJhd0xldmVsOiBBcnJheTxzdHJpbmc+O1xuXG4gIHByaXZhdGUgaG9sZXM6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgc2l6ZTogZXguVmVjdG9yO1xuXG4gIGNvbnN0cnVjdG9yKGxldmVsOiBBcnJheTxzdHJpbmc+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJhd0xldmVsID0gbGV2ZWw7XG4gIH1cblxuICBwdWJsaWMgb25Jbml0aWFsaXplKGVuZ2luZTogZXguRW5naW5lKSB7XG4gICAgLy8gVE9ETzogQ291bnQgeCBhcyB0aGUgbG9uZ2VzdCByb3cncyBsZW5ndGguXG4gICAgdGhpcy5zaXplID0gbmV3IGV4LlZlY3Rvcih0aGlzLnJhd0xldmVsWzBdLmxlbmd0aCwgdGhpcy5yYXdMZXZlbC5sZW5ndGgpO1xuICAgIHRoaXMuZ3JpZCA9IG5ldyBBcnJheSgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNpemUueTsgaSsrKSB7XG4gICAgICB0aGlzLmdyaWRbaV0gPSBuZXcgQXJyYXkodGhpcy5zaXplLngpO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMuc2l6ZS54OyBqKyspIHtcbiAgICAgICAgbGV0IGNlbGw6IENlbGwgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnJhd0xldmVsW2ldW2pdKSB7XG4gICAgICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCIuXCI6XG4gICAgICAgICAgICB0aGlzLmFkZEdyb3VuZChqLCBpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCIjXCI6XG4gICAgICAgICAgICBjZWxsID0gbmV3IFdhbGwoaiwgaSk7XG4gICAgICAgICAgICB0aGlzLmFkZEdyb3VuZChqLCBpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCIwXCI6XG4gICAgICAgICAgICBjZWxsID0gbmV3IEJveChqLCBpKTtcbiAgICAgICAgICAgIHRoaXMuYWRkR3JvdW5kKGosIGkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIl5cIjpcbiAgICAgICAgICAgIGNlbGwgPSBuZXcgSG9sZGVyKGosIGkpO1xuICAgICAgICAgICAgdGhpcy5ob2xlcyArPSAxO1xuICAgICAgICAgICAgdGhpcy5hZGRHcm91bmQoaiwgaSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiQFwiOlxuICAgICAgICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMsIGosIGkpO1xuICAgICAgICAgICAgLy8gUGxheWVyIGlzIG5vdCBhIHBhcnQgb2YgYSBncmlkLlxuICAgICAgICAgICAgdGhpcy5hZGQodGhpcy5wbGF5ZXIpO1xuICAgICAgICAgICAgdGhpcy5hZGRHcm91bmQoaiwgaSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjZWxsKSB7XG4gICAgICAgICAgdGhpcy5hZGQoY2VsbCk7XG4gICAgICAgICAgdGhpcy5ncmlkW2ldW2pdID0gY2VsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjYW1lcmEgPSBuZXcgZXguTG9ja2VkQ2FtZXJhKCk7XG5cbiAgICBjb25zdCB3aWR0aEZhY3RvciA9IChlbmdpbmUuZ2V0RHJhd1dpZHRoKCkgLSAyMCkgLyB0aGlzLnNpemUueDtcbiAgICBjb25zdCBoZWlnaHRGYWN0b3IgPSAoZW5naW5lLmdldERyYXdIZWlnaHQoKSAtIDIwKSAvIHRoaXMuc2l6ZS55O1xuXG4gICAgLy8gY2FtZXJhLnpvb20oTWF0aC5mbG9vcihNYXRoLm1pbih3aWR0aEZhY3RvciwgaGVpZ2h0RmFjdG9yKSAvIENlbGwuc2l6ZSkgfHwgMSk7XG4gICAgY2FtZXJhLnpvb20oTWF0aC5taW4od2lkdGhGYWN0b3IsIGhlaWdodEZhY3RvcikgLyBDZWxsLnNpemUpO1xuXG4gICAgY2FtZXJhLm1vdmUoXG4gICAgICBuZXcgZXguVmVjdG9yKFxuICAgICAgICB0aGlzLnNpemUueCAqIENlbGwuc2l6ZSAvIDIgLSBDZWxsLnNpemUgLyAyLFxuICAgICAgICB0aGlzLnNpemUueSAqIENlbGwuc2l6ZSAvIDIgLSBDZWxsLnNpemUgLyAyXG4gICAgICApLFxuICAgICAgMFxuICAgICk7XG5cbiAgICB0aGlzLmNhbWVyYSA9IGNhbWVyYTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkR3JvdW5kKGk6IG51bWJlciwgajogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5hZGQobmV3IEdyb3VuZChpLCBqKSk7XG4gIH1cblxuICBwdWJsaWMgY2xvc2VIb2xlKCk6IHZvaWQge1xuICAgIHRoaXMuaG9sZXMgLT0gMTtcbiAgICBpZiAodGhpcy5ob2xlcyA9PT0gMCkge1xuICAgICAgYWxlcnQoXCJZb3Ugd29uIVwiKTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3Qgc2ltcGxlTGV2ZWwgPSBbXG4gIFwiICAjIyMjIyNcIixcbiAgXCIgICMgLi5AI1wiLFxuICBcIiAgIyAwMCAjXCIsXG4gIFwiICAjIyAjIyNcIixcbiAgXCIgICAjICMgIFwiLFxuICBcIiAgICMgIyAgXCIsXG4gIFwiIyMjIyAjICBcIixcbiAgXCIjICAgICMjIFwiLFxuICBcIiMgIyAgICMgXCIsXG4gIFwiIyAgICMgIyBcIixcbiAgXCIjIyMgICAjIFwiLFxuICBcIiAgIyMjIyMgXCJcbl07XG5cbmNvbnN0IGxldmVsMWEgPSBbXG4gIFwiIyMjIyMjIyMgIyMjIyMjXCIsXG4gIFwiIyAjQCAgICMjIyAgICAjXCIsXG4gIFwiIy4jIyAwMCAgICAwICAjXCIsXG4gIFwiIy4jIyAgMDAjIDAgMCAjXCIsXG4gIFwiIy4jIyAgICAjICAgICAjXCIsXG4gIFwiIy4jIyMjIyMjMCMjIyMjXCIsXG4gIFwiIy4jICAgICMgICAgICAjXCIsXG4gIFwiIy4jIyMjIyMgICAgICAjXCIsXG4gIFwiIyAgLi4uLjAwMDAgICAjXCIsXG4gIFwiIyAgIyMjIyMgICAgICAjXCIsXG4gIFwiIyMjIyAgICMjIyMjIyMjXCJcbl07XG5cbmNvbnN0IGxldmVsMWIgPSBbXG4gIFwiIyMjIyMjICAjIyMjIyBcIixcbiAgXCIjLi4uLiMgICMuLi4jIFwiLFxuICBcIiMuMC4uIyMjIy4wLiMgXCIsXG4gIFwiIy4wLi4uLi4uMC4uIyBcIixcbiAgXCIjLi4jIyNAIyMjMC4jIFwiLFxuICBcIiMjIyMjIyMjIyMuIyMjXCIsXG4gIFwiIy4uXl5eLiMuLi4uLiNcIixcbiAgXCIjLi4jIyMjIzAuLi4uI1wiLFxuICBcIiMjXiMgICAjLjAuLi4jXCIsXG4gIFwiICNeIyMjIyMuMC4uLiNcIixcbiAgXCIgIy4uXl5eXjAuMC4uI1wiLFxuICBcIiAjLi4jIyMjIyMjIyMjXCIsXG4gIFwiICMjIyMgICAgICAgICBcIlxuXTtcblxuY29uc3QgbGV2ZWwyYSA9IFtcbiAgXCIgIyMjIyAgICAgICAgICAgICAgICAgICAgXCIsXG4gIFwiIyMgQCMjIyMjIyMjICAgICAgICAgICAgIFwiLFxuICBcIiMgICAgICAgICAgIyAgICAgICAgICAgICBcIixcbiAgXCIjIDAjIyMjIzAjICMgICAgICAgICAgICAgXCIsXG4gIFwiIyAgIyAgICMgMCAjICAgICAgICAgICAgIFwiLFxuICBcIiMgMCAwICAgIDAjIyAgICAgICAgICAgICBcIixcbiAgXCIjIDAgIDAgICMgICMgICAgICAgICAgICAgXCIsXG4gIFwiIyAjIyMjMCAjIyAjICAgICAgICAgICAgIFwiLFxuICBcIiMgIDAgICAwICMgIyMgICAgICAgICAgICBcIixcbiAgXCIjICMjIzAjICAgMCAjIyMjIyMjIyMjIyMjXCIsXG4gIFwiIyAgICMgIDAjIDAgLi4uLi4uLi4uLi4uI1wiLFxuICBcIiMgIDAgICAgICAjIyMjIyMjIyMjIyMjIyNcIixcbiAgXCIjIyMjIyAgIyAgIyAgICAgICAgICAgICAgXCIsXG4gIFwiICAgICMjIyMjIyMgICAgICAgICAgICAgIFwiXG5dO1xuXG5jb25zdCBsZXZlbDJiID0gW1xuICBcIiMjIyMjIyMjIyMjICAgICAgICAgICAgICAgICBcIixcbiAgXCIjICAgICMgICAgIyMjICAgICAgICAgICAgICAgXCIsXG4gIFwiIyAgMDAjMDAgICBAIyAgICAgICAgICAgICAgIFwiLFxuICBcIiMgICAgIDAgICAjIyMgICAgICAgICAgICAgICBcIixcbiAgXCIjICAgICMgICAgIyAgICAgICAgICAgICAgICAgXCIsXG4gIFwiIyMgIyMjIyMjIyMjICAgICAgICAgICAgICAgIFwiLFxuICBcIiMgIDAgIyAgICAgIyAgICAgICAgICAgICAgICBcIixcbiAgXCIjIDAwICMwIDAgMCMgICAgICAgICAgICAgICAgXCIsXG4gIFwiIyAgMCAgICAgMCAjICAgICAgICAgICAgICAgIFwiLFxuICBcIiMgMDAwIzAgIDAgIyMjIyMjIyMjIyMjIyMjIyNcIixcbiAgXCIjICAgICMgIDAgMCAuLi4uLi4uLi4uLi4uLi4jXCIsXG4gIFwiIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1wiXG5dO1xuXG5jb25zdCBsZXZlbDNhID0gW1xuICBcIiAgIyMjIyMjIyMgICAgICAgICBcIixcbiAgXCIjIyMgIyAgICAjICAgICAgICAgXCIsXG4gIFwiIyAgIDAgICAgIyMjICAgICAgIFwiLFxuICBcIiMgIyAwMCMwMCMgIyAgICAgICBcIixcbiAgXCIjIDAwIyAgICAgICMgICAgICAgXCIsXG4gIFwiIyAjICAwICMgICAjICAgICAgIFwiLFxuICBcIiMgICAgIzAjIzAjIyAgICAgICBcIixcbiAgXCIjICAwMCAgMCAgICMgICAgICAgXCIsXG4gIFwiIyAjIyAgICMgICAjICAgICAgIFwiLFxuICBcIiMgICAgIzAjIyMjIyAgICAgICBcIixcbiAgXCIjIyMgIDAgIyMjIyMjIyMjIyMjXCIsXG4gIFwiICAjICAwQC4uLi4uLi4uLi4uI1wiLFxuICBcIiAgIyMjIyMjIyMjIyMjIyMjIyNcIlxuXTtcblxuY29uc3QgbGV2ZWwzYiA9IFtcbiAgXCIjIyMjIyMjIyMjIyMjIyAgICAgXCIsXG4gIFwiIyAgICAgICAgIyAgICMgICAgIFwiLFxuICBcIiMgMDAgICMwMCMgIyAjICAgICBcIixcbiAgXCIjICAjIDAgMCAjMDAgIyAgICAgXCIsXG4gIFwiIyMgIyAgIyAgIyAjICMgICAgIFwiLFxuICBcIiMgICAjIyAgICAgICAjICAgICBcIixcbiAgXCIjICAgIyAwICMgICAjIyAgICAgXCIsXG4gIFwiIyAwICMwICMgICAjIyMgICAgIFwiLFxuICBcIiMjMCAjICAjIyMjIyMjIyMjIyNcIixcbiAgXCIjICAwICAgIC4uLi4uLi4uLi4jXCIsXG4gIFwiIyAgICMgQCMjIyMjIyMjIyMjI1wiLFxuICBcIiMjIyMjIyMjICAgICAgICAgICBcIlxuXTtcblxuY29uc3QgbGV2ZWw0YSA9IFtcbiAgXCIjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXCIsXG4gIFwiI0AgICAgICAuLi4uLi4uLi4uLi4uLi4uI1wiLFxuICBcIiMgICAgICAgIyMjIyMjIyMjIyMjIyMjIyNcIixcbiAgXCIjIyMjIyMjICMjIyMjIyAgICAgICAgICAgXCIsXG4gIFwiICMgICAgICAgICAgICMgICAgICAgICAgIFwiLFxuICBcIiAjIDAgMCAwIDAgMCAjICAgICAgICAgICBcIixcbiAgXCIjIyMjIyMjIyAjIyMjIyAgICAgICAgICAgXCIsXG4gIFwiIyAgIDAgMCAgMCAwICMgICAgICAgICAgIFwiLFxuICBcIiMgICAwICAgICAgICAjICAgICAgICAgICBcIixcbiAgXCIjIyMjIyAjIyMjIyMjIyAgICAgICAgICAgXCIsXG4gIFwiICMgIDAgMCAwICAgIyAgICAgICAgICAgIFwiLFxuICBcIiAjICAgICAwICAgICMgICAgICAgICAgICBcIixcbiAgXCIgIyAwIDAgICAwICMjICAgICAgICAgICAgXCIsXG4gIFwiIyMjIyMjIyAjIyMjICAgICAgICAgICAgIFwiLFxuICBcIiMgIDAgICAgICMgICAgICAgICAgICAgICBcIixcbiAgXCIjICAgICAgICAjICAgICAgICAgICAgICAgXCIsXG4gIFwiIyAgICMjIyMjIyAgICAgICAgICAgICAgIFwiLFxuICBcIiMjIyMjICAgICAgICAgICAgICAgICAgICBcIlxuXTtcblxuY29uc3QgbGV2ZWw0YiA9IFtcbiAgXCIgICMjIyMjIyMjIyMjIyNcIixcbiAgXCIgICMgIC4uLi4uLi4uLiNcIixcbiAgXCIgICMgIC4uLi4uLi4uLiNcIixcbiAgXCIgICMgICMjIyMjIyMjIyNcIixcbiAgXCIjIyMjICMgICAgIyMjIyNcIixcbiAgXCIjICAjMCMjICAjIyAgICNcIixcbiAgXCIjICAgICAjIyMjIDAgICNcIixcbiAgXCIjIDAwICAjICAjICAwICNcIixcbiAgXCIjIyAgMDAjICAgMDAgIyNcIixcbiAgXCIgIzAgIDAgICAjMCAgIyBcIixcbiAgXCIgIyAwMCAjICAjICAwIyBcIixcbiAgXCIgIyAwIDAjIyMjIDAgIyBcIixcbiAgXCIgIyAgICAgICAjICAjIyBcIixcbiAgXCIgIyMjIyAwICAjICMjICBcIixcbiAgXCIgICAgIyMjICMjICMgICBcIixcbiAgXCIgICAgICMgMCAgICMgICBcIixcbiAgXCIgICAgICNAICMgICMgICBcIixcbiAgXCIgICAgICMjIyMjIyMgICBcIlxuXTtcblxubGV0IGdhbWUgPSBuZXcgZXguRW5naW5lKHtcbiAgZGlzcGxheU1vZGU6IGV4LkRpc3BsYXlNb2RlLkZ1bGxTY3JlZW5cbn0pO1xuXG5nYW1lLnNldEFudGlhbGlhc2luZyh0cnVlKTtcbmdhbWUuYmFja2dyb3VuZENvbG9yID0gZXguQ29sb3IuRGFya0dyYXk7XG5nYW1lLmFkZFNjZW5lKFwibGV2ZWwxYlwiLCBuZXcgTGV2ZWwobGV2ZWwxYikpO1xuZ2FtZS5nb1RvU2NlbmUoXCJsZXZlbDFiXCIpO1xuZ2FtZS5zdGFydChsb2FkZXIpO1xuXG5jb25zdCBtb3ZlUGxheWVyQnkgPSBmdW5jdGlvbihkeDogbnVtYmVyLCBkeTogbnVtYmVyKSB7XG4gIGlmIChnYW1lLmN1cnJlbnRTY2VuZSBpbnN0YW5jZW9mIExldmVsKSB7XG4gICAgKGdhbWUuY3VycmVudFNjZW5lIGFzIExldmVsKS5wbGF5ZXIubW92ZUJ5KGR4LCBkeSk7XG4gIH1cbn07XG5cbltcImNsaWNrXCIsIFwidG91Y2hzdGFydFwiXS5mb3JFYWNoKGZ1bmN0aW9uIChhY3Rpb246IHN0cmluZykge1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udHJvbC1sZWZ0XCIpLmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCBmdW5jdGlvbihldmVudCl7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBtb3ZlUGxheWVyQnkoLTEsIDApO1xuICB9KTtcblxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRyb2wtdXBcIikuYWRkRXZlbnRMaXN0ZW5lcihhY3Rpb24sIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIG1vdmVQbGF5ZXJCeSgwLCAtMSk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udHJvbC1kb3duXCIpLmFkZEV2ZW50TGlzdGVuZXIoYWN0aW9uLCBmdW5jdGlvbihldmVudCl7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBtb3ZlUGxheWVyQnkoMCwgMSk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udHJvbC1yaWdodFwiKS5hZGRFdmVudExpc3RlbmVyKGFjdGlvbiwgZnVuY3Rpb24oZXZlbnQpe1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbW92ZVBsYXllckJ5KDEsIDApO1xuICB9KTtcbn0pO1xuIl19
