import * as ex from "excalibur";

import { SokobanLoader, resouces, LoadableLevel } from "./resources";
import { MainMenu } from "./menu";

abstract class Cell extends ex.Actor {
  static readonly size: number = 64;

  public gridPos: ex.Vector;
  protected origin: ex.Vector;

  constructor(x: number, y: number, private texture: ex.Texture) {
    super(x * Cell.size, y * Cell.size, Cell.size, Cell.size);
    this.origin = new ex.Vector(x, y);
    this.gridPos = new ex.Vector(x, y);
  }

  public onInitialize(engine: ex.Engine): void {
    this.addDrawing(this.texture);
  }

  public moveToOrigin(): void {
    this.pos = this.origin.scale(Cell.size);
    this.gridPos = this.origin.clone();
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

abstract class MovableCell extends Cell {
  public move(dx: number, dy: number) {
    this.pos.x += dx * Cell.size;
    this.pos.y += dy * Cell.size;
    this.gridPos.x += dx;
    this.gridPos.y += dy;
  }
}

class Box extends MovableCell {
  constructor(x: number, y: number) { super(x, y, resouces.txCrate); }
}

class Player extends MovableCell {
  private level: Level;

  constructor(level: Level, x: number, y: number) {
    super(x, y, resouces.txPlayer);
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
    const delta = new ex.Vector(dx, dy);
    let cell = this.level.obsticleAt(this.gridPos.add(delta));

    if (cell instanceof Wall) {
      resouces.sndOh.play();
      return;
    } else if (cell instanceof Box) {
      let nextCell = this.level.obsticleAt(this.gridPos.add(delta.scale(2)));

      if (nextCell === undefined) {
        cell.move(dx, dy);

        if (this.level.isHoleAt(this.gridPos.add(delta.scale(2)))) {
          resouces.sndFill.play();
          this.level.closeHole();
        } else {
          resouces.sndDrag.play();
        }
      } else {
        resouces.sndOh.play();
        return;
      }
    } else {
      resouces.sndStep.play();
    }

    this.move(dx, dy);
  }
}

class Level extends ex.Scene {
  public player: Player;
  private grid: Array<Array<Wall>>;

  private rawLevel: Array<string>;

  private size: ex.Vector;

  private boxes: Array<Box> = [];
  private holes: Array<Holder> = [];

  constructor(level: LoadableLevel) {
    super();
    this.rawLevel = level.grid;

    const longestRow = Math.max.apply(null, this.rawLevel.map((row) => row.length));

    this.size = new ex.Vector(longestRow, this.rawLevel.length);
  }

  public update(engine: ex.Engine, delta: number) {
    super.update(engine, delta);

    if (engine.input.keyboard.wasPressed(ex.Input.Keys.R)) {
      this.reset();
    }
  };

  public reset(): void {
    this.boxes.forEach((actor) => actor.moveToOrigin());
    this.player.moveToOrigin();
  }

  public onInitialize(engine: ex.Engine) {
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
  }

  public closeHole(): void {
    if (this.holes.every((hole) => this.isHoleClosed(hole))) {
      alert("You won!");
    }
  }

  public obsticleAt(pos: ex.Vector): Cell {
    return this.grid[pos.y][pos.x] || this.boxes.find((box) => box.gridPos.equals(pos));
  }

  public isHoleAt(pos: ex.Vector): boolean {
    return this.holes.some((hole) => hole.gridPos.equals(pos));
  }

  private isHoleClosed(hole: Holder): boolean {
    return !!this.obsticleAt(hole.gridPos);
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
game.start(new SokobanLoader()).then(function() {
  game.addScene("level0", new Level(resouces.level0));
  game.addScene("level1", new Level(resouces.level1));
  game.addScene("level1a", new Level(resouces.level1a));
  game.addScene("level1b", new Level(resouces.level1b));
  game.addScene("level2a", new Level(resouces.level2a));
  game.addScene("level2b", new Level(resouces.level2b));
  game.addScene("level3a", new Level(resouces.level3a));
  game.addScene("level3b", new Level(resouces.level3b));
  game.addScene("level4a", new Level(resouces.level4a));
  game.addScene("level4b", new Level(resouces.level4b));

  game.addScene("MainMenu", new MainMenu());

  game.goToScene("MainMenu");
});

const movePlayerBy = function(dx: number, dy: number) {
  if (game.currentScene instanceof Level) {
    (game.currentScene as Level).player.moveBy(dx, dy);
  }
};

["click", "touchstart"].forEach(function (action: string) {
  document.getElementById("control-refresh").addEventListener(action, function(event){
    event.preventDefault();
    if (game.currentScene instanceof Level) {
      (game.currentScene as Level).reset();
    }
  });

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
