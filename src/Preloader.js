import Phaser from "phaser";

/**
 * Preloader scene - loads all game assets before starting
 */
export class Preloader extends Phaser.Scene {
  constructor() {
    super({
      key: "Preloader",
    });
  }

  preload() {
    this.createLoadingScreen();

    this.load.on("loaderror", (file) => {
      console.error("Error loading file:", file.key, file.src);
    });

    this.load.setPath("assets/");

    // UI elements
    this.load.image("volume-icon-on", "ui/volume-icon-on.png");
    this.load.image("volume-icon-off", "ui/volume-icon-off.png");
    this.load.image("heart", "ui/heart.png");

    // Audio assets
    this.load.audio("theme-song", "audio/theme-song.mp3");
    this.load.audio("whoosh", "audio/whoosh.mp3");
    this.load.audio("card-flip", "audio/card-flip.mp3");
    this.load.audio("card-match", "audio/card-match.mp3");
    this.load.audio("card-mismatch", "audio/card-mismatch.mp3");
    this.load.audio("card-slide", "audio/card-slide.mp3");
    this.load.audio("victory", "audio/victory.mp3");

    // Art assets
    this.load.image("background");
    this.load.image("card-back", "cards/card-back.png");
    this.load.image("card-0", "cards/card-0.png");
    this.load.image("card-1", "cards/card-1.png");
    this.load.image("card-2", "cards/card-2.png");
    this.load.image("card-3", "cards/card-3.png");
    this.load.image("card-4", "cards/card-4.png");
    this.load.image("card-5", "cards/card-5.png");
  }

  createLoadingScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, "Loading...", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
    });
    loadingText.setOrigin(0.5);

    // Progress bar background (gray box)
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);

    // Progress bar fill (colored bar)
    const progressBar = this.add.graphics();

    // Percentage text
    const percentText = this.add.text(width / 2, height / 2 + 15, "0%", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff",
    });
    percentText.setOrigin(0.5);

    // Asset loading text
    const assetText = this.add.text(width / 2, height / 2 + 60, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
    });
    assetText.setOrigin(0.5);

    // Update progress bar as files load
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 10);

      percentText.setText(Math.floor(value * 100) + "%");
    });

    // Update asset text as each file loads
    this.load.on("fileprogress", (file) => {
      assetText.setText("Loading: " + file.key);
    });

    // Remove loading screen when complete
    // this.load.on("complete", () => {
    //   progressBar.destroy();
    //   progressBox.destroy();
    //   loadingText.destroy();
    //   percentText.destroy();
    //   assetText.destroy();
    // });
  }

  create() {
    this.scene.start("Play");
  }

  shutdown() {
    if (this.load) {
      this.load.removeAllListeners();
    }
  }
}
