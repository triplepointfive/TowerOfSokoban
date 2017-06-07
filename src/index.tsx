let game = new ex.Engine({
  width: 800,
  height: 600
});

class Wall extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.Gray);
    this.collisionType = ex.CollisionType.Fixed;
  }
}

class Player extends ex.Actor {
  constructor(x: number, y: number) {
    super(x, y, 40, 40, ex.Color.White);
    this.collisionType = ex.CollisionType.Fixed;
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
            game.add(new Player(x, y));
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
