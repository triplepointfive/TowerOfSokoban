let game = new ex.Engine({
  displayMode: ex.DisplayMode.FullScreen
});

abstract class Cell extends ex.Actor {
  static readonly size: number = 40;

  constructor(x: number, y: number, color: ex.Color) {
    super(Cell.size / 2 + x * Cell.size, Cell.size / 2 + y * Cell.size, Cell.size, Cell.size, color);
  }
}

class Wall extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Gray); }
}

class Holder extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Black); }
}

class Box extends Cell {
  constructor(x: number, y: number) { super(x, y, ex.Color.Orange); }
}

class Player extends Cell {
  private level: Level;

  constructor(level: Level, private gridX: number, private gridY: number) {
    super(gridX, gridY, ex.Color.White);

    this.level = level;
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

  private moveBy(dx: number, dy: number): void {
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

class Level {
  protected player: Player;
  public grid: Array<Array<Cell>>;

  private holes: number = 0;

  constructor(level: Array<string>) {
    this.grid = new Array(level.length);

    for (let i = 0; i < level.length; i++) {
      this.grid[i] = new Array(level[i].length);

      for (let j = 0; j < level[i].length; j++) {
        let cell: Cell = undefined;

        switch (level[i][j]) {
          case "#":
            cell = new Wall(j, i);
            break;
          case "0":
            cell = new Box(j, i);
            break;
          case ".":
            cell = new Holder(j, i);
            this.holes += 1;
            break;
          case "@":
            this.player = new Player(this, j, i);
            // Player is not a part of a grid.
            game.add(this.player);
            break;
        }

        this.grid[i][j] = cell;

        if (cell) { game.add(cell); }
      }
    }
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

const level1b = [
  "######  ##### ",
  "#    #  #   # ",
  "# 0  #### 0 # ",
  "# 0      0  # ",
  "#  ###@###0 # ",
  "########## ###",
  "#  ... #     #",
  "#  #####0    #",
  "##.#   # 0   #",
  " #.##### 0   #",
  " #  ....0 0  #",
  " #  ##########",
  " ####         "
];

new Level(level1b);

let camera = new ex.LockedCamera();

const bounds = game.getWorldBounds();

const scaleFactor = Math.floor(Math.min(bounds.right / 560, bounds.bottom / 520));

camera.move(new ex.Vector(280, 520), 0);
camera.zoom(scaleFactor);

game.currentScene.camera = camera;

game.start();
