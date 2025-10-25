import Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super({
      key: "Preloader",
    });
  }

  preload() {
    // Add error handling for failed loads
    this.load.on("loaderror", (file) => {
      console.error("Error loading file:", file.key, file.src);
    });

    this.load.setPath("assets/");

    this.load.image("volume-icon-on", "ui/volume-icon-on.png");
    this.load.image("volume-icon-off", "ui/volume-icon-off.png");

    this.load.audio("theme-song", "audio/theme-song.mp3");
    this.load.audio("whoosh", "audio/whoosh.mp3");
    this.load.audio("card-flip", "audio/card-flip.mp3");
    this.load.audio("card-match", "audio/card-match.mp3");
    this.load.audio("card-mismatch", "audio/card-mismatch.mp3");
    this.load.audio("card-slide", "audio/card-slide.mp3");
    this.load.audio("victory", "audio/victory.mp3");
    this.load.image("background");
    this.load.image("card-back", "cards/card-back.png");
    this.load.image("card-0", "cards/card-0.png");
    this.load.image("card-1", "cards/card-1.png");
    this.load.image("card-2", "cards/card-2.png");
    this.load.image("card-3", "cards/card-3.png");
    this.load.image("card-4", "cards/card-4.png");
    this.load.image("card-5", "cards/card-5.png");

    this.load.image("heart", "ui/heart.png");
  }

  create() {
    this.scene.start("Play");
  }

  shutdown() {
    // Clean up loader event listeners
    if (this.load) {
      this.load.removeAllListeners();
    }
  }
}
