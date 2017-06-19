import * as ex from "excalibur";

export interface Resouces {
  [index: string]: ex.ILoadable;
  txWall: ex.Texture;
  txCrate: ex.Texture;
  txEndPoint: ex.Texture;
  txPlayer: ex.Texture;
  txGround: ex.Texture;

  sndOh: ex.Sound;
  sndDrag: ex.Sound;
  sndFill: ex.Sound;
  sndStep: ex.Sound;
}

export const resouces: Resouces = {
  txWall: new ex.Texture("./images/Wall_Black.png"),
  txCrate: new ex.Texture("./images/Crate_Yellow.png"),
  txEndPoint: new ex.Texture("./images/EndPoint_Yellow.png"),
  txPlayer: new ex.Texture("./images/Character4.png"),
  txGround: new ex.Texture("./images/GroundGravel_Concrete.png"),

  sndOh: new ex.Sound("./sounds/oh.wav"),
  sndDrag: new ex.Sound("./sounds/drag.wav"),
  sndFill: new ex.Sound("./sounds/fill.wav"),
  sndStep: new ex.Sound("./sounds/step.wav")
};
