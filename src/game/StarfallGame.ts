import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export function createStarfallGame(parentContainerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parentContainerId,
    width: "100%",
    height: "100%",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
      powerPreference: "high-performance",
    },
    scene: [BootScene, GameScene],
    backgroundColor: "#070814",
  };

  return new Phaser.Game(config);
}
