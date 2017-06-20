import * as ex from "excalibur";

export class SokobanLoader extends ex.Loader {
  constructor() {
    super();

    for (const key in resouces) {
      this.addResource(resouces[key]);
    }
  }
}

export class LoadableLevel extends ex.Resource<string> {
  public grid: Array<string>;

  constructor(path: string) { super(path, "text"); }

  public processData(data: string): void {
    this.grid = data.split(/\r?\n/);
  }
}

export interface Resouces {
  [index: string]: ex.ILoadable;
  txWall: ex.Texture;
  txCrate: ex.Texture;
  txEndPoint: ex.Texture;
  txPlayer: ex.Texture;
  txGround: ex.Texture;
  txLogo: ex.Texture;

  uiGoToMenu: ex.Texture;
  uiReset: ex.Texture;
  uiUp: ex.Texture;
  uiDown: ex.Texture;
  uiLeft: ex.Texture;
  uiRight: ex.Texture;

  sndOh: ex.Sound;
  sndDrag: ex.Sound;
  sndFill: ex.Sound;
  sndStep: ex.Sound;

  level0: LoadableLevel;
  level1: LoadableLevel;
  level1a: LoadableLevel;
  level1b: LoadableLevel;
  level2a: LoadableLevel;
  level2b: LoadableLevel;
  level3a: LoadableLevel;
  level3b: LoadableLevel;
  level4a: LoadableLevel;
  level4b: LoadableLevel;
}

export const resouces: Resouces = {
  txWall: new ex.Texture("./images/Wall_Black.png"),
  txCrate: new ex.Texture("./images/Crate_Yellow.png"),
  txEndPoint: new ex.Texture("./images/EndPoint_Yellow.png"),
  txPlayer: new ex.Texture("./images/Character4.png"),
  txGround: new ex.Texture("./images/GroundGravel_Concrete.png"),
  txLogo: new ex.Texture("./images/logo.png"),

  uiGoToMenu: new ex.Texture("./images/log-in.svg"),
  uiReset: new ex.Texture("./images/refresh-cw.svg"),
  uiUp: new ex.Texture("./images/chevron-up.svg"),
  uiDown: new ex.Texture("./images/chevron-down.svg"),
  uiLeft: new ex.Texture("./images/chevron-left.svg"),
  uiRight: new ex.Texture("./images/chevron-right.svg"),

  sndOh: new ex.Sound("./sounds/oh.wav"),
  sndDrag: new ex.Sound("./sounds/drag.wav"),
  sndFill: new ex.Sound("./sounds/fill.wav"),
  sndStep: new ex.Sound("./sounds/step.wav"),

  level0: new LoadableLevel("./levels/0.txt"),
  level1: new LoadableLevel("./levels/1.txt"),
  level1a: new LoadableLevel("./levels/1a.txt"),
  level1b: new LoadableLevel("./levels/1b.txt"),
  level2a: new LoadableLevel("./levels/2a.txt"),
  level2b: new LoadableLevel("./levels/2b.txt"),
  level3a: new LoadableLevel("./levels/3a.txt"),
  level3b: new LoadableLevel("./levels/3b.txt"),
  level4a: new LoadableLevel("./levels/4a.txt"),
  level4b: new LoadableLevel("./levels/4b.txt")
};
