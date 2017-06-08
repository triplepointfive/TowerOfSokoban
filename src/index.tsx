let game = new ex.Engine({
  width: 320,
  height: 480
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

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.W)) {
      this.moveBy(0, -1);
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.S)) {
      this.moveBy(0, 1);
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.D)) {
      this.moveBy(1, 0);
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.A)) {
      this.moveBy(-1, 0);
    }
  }

  private moveBy(dx: number, dy: number): void {
    let cell = this.level.grid[this.gridY + dy][this.gridX + dx];

    console.log(this.gridX + dx, this.gridY + dy);

    if (cell instanceof Wall) {
      return;
    }

    this.gridX += dx;
    this.gridY += dy;
    this.pos = this.pos.add(new ex.Vector(dx, dy).scale(Cell.size));
  }
}

class Level {
  protected player: Player;
  public grid: Array<Array<Cell>>;

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

    console.log(this.grid);
  }
}

new Level([
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
]);

game.start();
