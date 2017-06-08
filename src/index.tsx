let game = new ex.Engine({
  width: 800,
  height: 600
});

abstract class Cell extends ex.Actor {
  static readonly size: number = 40;

  constructor(x: number, y: number, color: ex.Color) {
    super(x * Cell.size, y * Cell.size, Cell.size, Cell.size, color);
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

const vel = Cell.size;

class Player extends Cell {
  constructor(x: number, y: number) {
    super(x, y, ex.Color.White);

    this.on("collision", function(ex: ex.CollisionEvent) {
      if (ex.other instanceof Wall) {
        ex.actor.pos = ex.actor.oldPos;
      }
    });
  }

  public update(engine: ex.Engine, delta: number) {
    super.update(engine, delta);

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.W)) {
      this.pos = this.pos.add(new ex.Vector(0, -vel));
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.S)) {
      this.pos = this.pos.add(new ex.Vector(0, vel));
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.D)) {
      this.pos = this.pos.add(new ex.Vector(vel, 0));
    }

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.A)) {
      this.pos = this.pos.add(new ex.Vector(-vel, 0));
    }
  }
}

class Level {
  protected player: Player;
  protected grid: Array<Array<Cell>>;

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
            this.player = new Player(j, i);
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
