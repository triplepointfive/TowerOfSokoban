import * as ex from "excalibur";

import { LoadableLevel, Resouces, resouces } from "./resources";

const loader = new ex.Loader();

for (const key in resouces) {
  loader.addResource(resouces[key]);
}

abstract class Cell extends ex.Actor {
  static readonly size: number = 64;

  constructor(x: number, y: number, private texture: ex.Texture) {
    super(x * Cell.size, y * Cell.size, Cell.size, Cell.size);
  }

  public onInitialize(engine: ex.Engine): void {
    this.addDrawing(this.texture);
  }
}

class Wall extends Cell {
  constructor(x: number, y: number) { super(x, y, resouces.txWall); }
}

class Holder extends Cell {
  constructor(x: number, y: number) { super(x, y, resouces.txEndPoint); }
}

class Ground extends Cell {
  constructor(x: number, y: number) { super(x, y, resouces.txGround); }

  public onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    this.setZIndex(-1);
  }
}

class Box extends Cell {
  constructor(x: number, y: number) { super(x, y, resouces.txCrate); }
}

class Player extends Cell {
  private level: Level;

  constructor(level: Level, private gridX: number, private gridY: number) {
    super(gridX, gridY, resouces.txPlayer);

    this.level = level;
  }

  public onInitialize(engine: ex.Engine) {
    super.onInitialize(engine);
    this.setZIndex(1);
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
      resouces.sndOh.play();
      return;
    }

    if (cell instanceof Box) {
      let nextCell = this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx];

      if (nextCell === undefined) {
        resouces.sndDrag.play();
        cell.pos = cell.pos.add(delta);
        this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
        this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = cell;

      } else if (nextCell instanceof Holder) {
        resouces.sndFill.play();
        this.level.grid[this.gridY + dy][this.gridX + dx] = undefined;
        this.level.grid[this.gridY + 2 * dy][this.gridX + 2 * dx] = undefined;
        cell.kill();
        nextCell.kill();
        this.level.closeHole();
      } else {
        resouces.sndOh.play();
        return;
      }
    } else {
      resouces.sndStep.play();
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

  constructor(level: LoadableLevel) {
    super();
    console.log(level);
    this.rawLevel = level.grid;

    const longestRow = Math.max.apply(null, this.rawLevel.map((row) => row.length));

    this.size = new ex.Vector(longestRow, this.rawLevel.length);
  }

  public update(engine: ex.Engine, delta: number) {
    super.update(engine, delta);

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.R)) {
      this.reset(engine);
    }
  };

  public reset(engine: ex.Engine): void {
    this.children.forEach((actor) => actor.kill());
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
  }

  public onInitialize(engine: ex.Engine) {
    this.reset(engine);
    this.initCamera(engine);
  }

  public closeHole(): void {
    this.holes -= 1;
    if (this.holes === 0) {
      alert("You won!");
    }
  }

  private initCamera(engine: ex.Engine): void {
    const camera = new ex.LockedCamera();

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
}

let game = new ex.Engine({
  displayMode: ex.DisplayMode.FullScreen
});

game.setAntialiasing(true);
game.backgroundColor = ex.Color.DarkGray;
game.start(loader).then(function() {
  game.addScene("level1b", new Level(resouces.level1b));
  game.goToScene("level1b");
});

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
