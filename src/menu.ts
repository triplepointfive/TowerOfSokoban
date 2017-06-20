import * as ex from "excalibur";

import { resouces } from "./resources";

export class Button extends ex.UIActor {
  constructor(private onClick: (engine: ex.Engine) => void, x: number, y: number, w: number) {
    super(x, y, w, w);
  }

  public onInitialize(engine: ex.Engine) {
    super.onInitialize(engine);

    this.on("pointerup", () => { this.onClick(engine); });
  }
}

export class LevelButton extends Button {
  constructor(levelName: string, x: number, y: number, w: number) {
    super((engine) => { engine.goToScene(levelName); }, x, y, w);
  }
}

class LevelButtonWithText extends LevelButton {
  constructor(private name: string, levelName: string, x: number, y: number, w: number) {
    super(levelName, x, y, w);
  }

  public draw(ctx: CanvasRenderingContext2D, delta: number): void {
    const rectWidth = 5;

    ctx.beginPath();

    ctx.fillStyle = ex.Color.White.toString();
    ctx.fillRect(this.pos.x, this.pos.y, this.getWidth(), this.getHeight());

    ctx.fillStyle = ex.Color.DarkGray.toString();
    ctx.fillRect(this.pos.x + rectWidth, this.pos.y + rectWidth, this.getWidth() - 2 * rectWidth, this.getHeight() - 2 * rectWidth);

    ctx.fillStyle = ex.Color.Black.toString();
    ctx.font = "30px serif";

    ctx.textAlign = "center";
    ctx.fillText(
      this.name,
      this.pos.x + this.getWidth() / 2,
      this.pos.y + this.getHeight() / 2 + 2 * rectWidth
    );

    ctx.closePath();
    ctx.fill();
  }
}

class TopLogo extends ex.UIActor {
  public onInitialize(engine: ex.Engine): void {
    super.onInitialize(engine);
    this.addDrawing(resouces.txLogo);

    this.pos.x += (engine.getDrawWidth() - resouces.txLogo.width) / 2;
  }
}

export class MainMenu extends ex.Scene {
  constructor() {
    super();
  }

  public onInitialize(engine: ex.Engine) {
    const w = engine.getDrawWidth();
    let h = engine.getDrawHeight();

    const topLogoHeight = h / 5;

    this.add(
      new TopLogo(
        0,
        topLogoHeight / 4,
        w,
        topLogoHeight / 2
      )
    );

    h -= topLogoHeight;

    if (h / 17 < w / 9) {
      const size = h / 17;

      const offsetH = (w - size * 6) / 3;

      ["a", "b"].forEach((letter, j) => {
        [1, 2, 3, 4].forEach((num, i) => {
          let button = new LevelButtonWithText(
            `${num}${letter}`,
            `level${num}${letter}`,
            offsetH * (1 + j) + size * 3 * j,
            topLogoHeight + (size * (1 + i * 4)),
            size * 3
          );

          this.add(button);
        });
      });
    } else {
      // TODO: Implement wide screen's layout
    }
  }
}
