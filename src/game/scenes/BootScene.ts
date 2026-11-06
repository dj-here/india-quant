import * as Phaser from "phaser";
import { TextureGenerator } from "../graphics/TextureGenerator";
import { soundEngine } from "../audio/SoundEngine";
import { musicSynthesizer } from "../audio/MusicSynthesizer";
import { eventBus, EVENTS } from "../../lib/EventBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  public preload(): void {
    // Generate procedural vector textures
    TextureGenerator.generateAllTextures(this);
  }

  public create(): void {
    // Initialize procedural audio contexts on first user gesture
    const unlockAudio = () => {
      soundEngine.init();
      musicSynthesizer.init();
      this.input.off("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };

    this.input.on("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    // Notify React that Boot is finished
    eventBus.emit(EVENTS.GAME_READY);

    // Transition to active GameScene
    this.scene.start("GameScene");
  }
}
