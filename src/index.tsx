let game = new ex.Engine({
  width: 800,
  height: 600
});

class Wall extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.Gray);
    this.collisionType = ex.CollisionType.Fixed;
  }

  public onInitialize(engine: ex.Engine) {
    console.log("Walls");
    this.addCollisionGroup("Walls");
  }
}

const vel = 40;

class Player extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.White);
    this.collisionType = ex.CollisionType.Active;

    this.onCollidesWith("Walls", function() {
      console.log("Wall");
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

class Holder extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.Black);
    this.collisionType = ex.CollisionType.Passive;
  }
}

class Box extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.Orange);
    this.collisionType = ex.CollisionType.Active;
  }
}

class Level {
  public player: Player;

  constructor(level: Array<string>) {
    const offsetX = 50;
    const offsetY = 50;

    for (let i = 0; i < level.length; i++) {
      for (let j = 0; j < level[i].length; j++) {
        const x = offsetX + j * 40, y = offsetY + i * 40;

        switch (level[i][j]) {
          case "#":
            game.add(new Wall(x, y));
            break;
          case "0":
            game.add(new Box(x, y));
            break;
          case ".":
            game.add(new Holder(x, y));
            break;
          case "@":
            this.player = new Player(x, y);
            game.add(this.player);
            break;
        }
      }
    }
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
