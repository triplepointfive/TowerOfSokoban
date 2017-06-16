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

abstract class Cell extends ex.Actor {
  static readonly size: number = 64;

  constructor(x: number, y: number, color: ex.Color) {
    super(x * Cell.size, y * Cell.size, Cell.size, Cell.size, color);
  }
}

class Wall extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Gray); }

  public onInitialize(engine: ex.Engine): void {
    this.addDrawing(txWall);
  }
}

class Holder extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Black); }

  public onInitialize(engine: ex.Engine): void {
    this.addDrawing(txEndPoint);
  }
}

class Ground extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Black); }

  public onInitialize(engine: ex.Engine): void {
    this.setZIndex(-1);
    this.addDrawing(txGround);
  }
}

class Box extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Orange); }

  public onInitialize(engine: ex.Engine): void {
    this.addDrawing(txCrate);
  }
}

class Player extends Cell {
  private level: Level;

  constructor(level: Level, private gridX: number, private gridY: number) {
    super(gridX, gridY, ex.Color.White);

    this.level = level;
  }

  public onInitialize(engine: ex.Engine) {
    this.setZIndex(1);
    this.addDrawing(txPlayer);
  }

  public update(engine: ex.Engine, delta: number) {
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

  public moveBy(dx: number, dy: number): void {
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

      } else if (nextCell instanceof Holder) {
        this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
        this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = undefined;
        cell.kill();
        nextCell.kill();
        this.level.closeHole();
      } else {
        return;
      }
    }

    this.gridX += dx;
    this.gridY += dy;
    this.pos = this.pos.add(delta);
  }
}

class Level extends ex.Scene {
  public player: Player;
  public grid: Array<Array<Cell>>;

  private rawLevel: Array<string>;

  private holes: number = 0;
  private size: ex.Vector;

  constructor(level: Array<string>) {
    super();
    this.rawLevel = level;
  }

  public onInitialize(engine: ex.Engine) {
    // TODO: Count x as the longest row's length.
    this.size = new ex.Vector(this.rawLevel[0].length, this.rawLevel.length);
    this.grid = new Array();

    for (let i = 0; i < this.size.y; i++) {
      this.grid[i] = new Array(this.size.x);

      for (let j = 0; j < this.size.x; j++) {
        let cell: Cell = undefined;

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

    camera.move(
      new ex.Vector(
        this.size.x * Cell.size / 2 - Cell.size / 2,
        this.size.y * Cell.size / 2 - Cell.size / 2
      ),
      0
    );

    this.camera = camera;
  }

  private addGround(i: number, j: number): void {
    this.add(new Ground(i, j));
  }

  public closeHole(): void {
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

const movePlayerBy = function(dx: number, dy: number) {
  if (game.currentScene instanceof Level) {
    (game.currentScene as Level).player.moveBy(dx, dy);
  }
};

["click", "touchstart"].forEach(function (action: string) {

  document.getElementById("control-left").addEventListener(action, function(event){
    event.preventDefault();
    movePlayerBy(-1, 0);
  });

  document.getElementById("control-up").addEventListener(action, function(event){
    event.preventDefault();
    movePlayerBy(0, -1);
  });

  document.getElementById("control-down").addEventListener(action, function(event){
    event.preventDefault();
    movePlayerBy(0, 1);
  });

  document.getElementById("control-right").addEventListener(action, function(event){
    event.preventDefault();
    movePlayerBy(1, 0);
  });
});
