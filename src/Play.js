import { createCard } from "./createCard";
import Phaser from "phaser";
import { COLORS } from "./constants/colors";
import { TEXTS } from "./constants/texts";

// Debug mode for testing win/lose scenarios (W/L keys)
const DEBUG_MODE = false;

/**
 * Main game scene for the memory card matching game.
 * Manages game state, card grid, lives, and win/lose conditions.
 */
export class Play extends Phaser.Scene {
  // Available card types
  cardNames = ["card-0", "card-1", "card-2", "card-3", "card-4", "card-5"];

  // Active card instances
  cards = [];

  // Currently flipped card awaiting a match
  cardOpened = undefined;

  // Input is enabled when true
  canMove = false;

  // Remaining attempts
  lives = 0;

  // Card layout settings
  gridConfiguration = {
    x: 113,
    y: 102,
    paddingX: 10,
    paddingY: 10,
  };

  constructor() {
    super({
      key: "Play",
    });
    // Track resources for cleanup
    this.activeTweens = [];
    this.pointerMoveHandler = null;
    this.pointerDownHandler = null;
  }

  init() {
    this.cameras.main.fadeIn(500);
    this.lives = 10;
    this.volumeButton();
  }

  shutdown() {
    // Clean up event listeners
    if (this.pointerMoveHandler) {
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.pointerMoveHandler);
      this.pointerMoveHandler = null;
    }
    if (this.pointerDownHandler) {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.pointerDownHandler);
      this.pointerDownHandler = null;
    }

    // Stop all active tweens
    this.activeTweens.forEach((tween) => {
      if (tween && !tween.isDestroyed()) {
        tween.stop();
      }
    });
    this.activeTweens = [];

    // Reset cursor
    this.input.setDefaultCursor("default");

    // Clean up shutdown handlers
    this.events.off("shutdown", this.shutdown, this);
    this.events.off("destroy", this.shutdown, this);
  }

  create() {
    this.events.once("shutdown", this.shutdown, this);
    this.events.once("destroy", this.shutdown, this);

    this.add.image(0, 0, "background").setOrigin(0);

    // Create title with blinking effect
    const titleText = this.add
      .text(this.sys.game.scale.width / 2, this.sys.game.scale.height / 2, TEXTS.TITLE, {
        align: "center",
        strokeThickness: 4,
        fontSize: 40,
        fontStyle: "bold",
        color: COLORS.TITLE_TEXT,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive();

    // Retro arcade blinking effect
    const titleTween = this.add.tween({
      targets: titleText,
      duration: 800,
      ease: (value) => value > 0.8,
      alpha: 0,
      repeat: -1,
      yoyo: true,
    });
    this.activeTweens.push(titleTween);

    // Title hover effects
    titleText.on(Phaser.Input.Events.POINTER_OVER, () => {
      titleText.setColor(COLORS.TITLE_TEXT_HOVER);
      this.input.setDefaultCursor("pointer");
    });
    titleText.on(Phaser.Input.Events.POINTER_OUT, () => {
      titleText.setColor(COLORS.TITLE_TEXT);
      this.input.setDefaultCursor("default");
    });

    // Start game on click
    titleText.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.sound.play("whoosh", { volume: 1.3 });
      const startTween = this.add.tween({
        targets: titleText,
        ease: Phaser.Math.Easing.Bounce.InOut,
        y: -1000,
        onComplete: () => {
          if (!this.sound.get("theme-song")) {
            this.sound.play("theme-song", { loop: true, volume: 0.5 });
          }
          this.startGame();
        },
      });
      this.activeTweens.push(startTween);
    });
  }

  restartGame() {
    this.cardOpened = undefined;
    this.canMove = false;
    this.cameras.main.fadeOut(200 * this.cards.length);

    this.time.addEvent({
      delay: 200 * this.cards.length,
      callback: () => {
        this.scene.restart();
      },
    });
  }

  createGridCards() {
    const gridCardNames = Phaser.Utils.Array.Shuffle([...this.cardNames, ...this.cardNames]);

    return gridCardNames.map((name, index) => {
      const newCard = createCard({
        scene: this,
        x: this.gridConfiguration.x + (98 + this.gridConfiguration.paddingX) * (index % 4),
        y: -1000,
        frontTexture: name,
        cardName: name,
      });
      const cardTween = this.add.tween({
        targets: newCard.gameObject,
        duration: 800,
        delay: index * 100,
        onStart: () => this.sound.play("card-slide", { volume: 1.2 }),
        y: this.gridConfiguration.y + (128 + this.gridConfiguration.paddingY) * Math.floor(index / 4),
      });
      this.activeTweens.push(cardTween);
      return newCard;
    });
  }

  /**
   * Create heart icons representing remaining lives
   */
  createHearts() {
    return Array.from(new Array(this.lives)).map((el, index) => {
      const heart = this.add.image(this.sys.game.scale.width + 1000, 20, "heart");

      const heartTween = this.add.tween({
        targets: heart,
        ease: Phaser.Math.Easing.Expo.InOut,
        duration: 1000,
        delay: 1000 + index * 200,
        x: 140 + 30 * index, // marginLeft + spaceBetween * index
      });
      this.activeTweens.push(heartTween);
      return heart;
    });
  }

  /**
   * Create and configure volume toggle button
   */
  volumeButton() {
    const volumeIcon = this.add.image(532, 350, "volume-icon-on").setName("volume-icon").setDepth(1);
    volumeIcon.setInteractive();

    volumeIcon.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.input.setDefaultCursor("pointer");
    });

    volumeIcon.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.input.setDefaultCursor("default");
    });

    volumeIcon.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.sound.volume === 0) {
        this.sound.setVolume(1);
        volumeIcon.setTexture("volume-icon-on");
        volumeIcon.setAlpha(1);
      } else {
        this.sound.setVolume(0);
        volumeIcon.setTexture("volume-icon-off");
        volumeIcon.setAlpha(0.5);
      }
    });
  }

  startGame() {
    // Create win and game over text elements
    const winnerText = this.add
      .text(this.sys.game.scale.width / 2, -1000, TEXTS.YOU_WIN, {
        align: "center",
        strokeThickness: 4,
        fontSize: 40,
        fontStyle: "bold",
        color: COLORS.WINNER_TEXT,
      })
      .setOrigin(0.5)
      .setDepth(3)
      .setInteractive();

    const gameOverText = this.add
      .text(this.sys.game.scale.width / 2, -1000, TEXTS.GAME_OVER, {
        align: "center",
        strokeThickness: 4,
        fontSize: 40,
        fontStyle: "bold",
        color: COLORS.GAME_OVER_TEXT,
      })
      .setName("gameOverText")
      .setDepth(3)
      .setOrigin(0.5)
      .setInteractive();

    const hearts = this.createHearts();
    this.cards = this.createGridCards();

    // Debug shortcuts (W = win, L = lose)
    if (DEBUG_MODE) {
      this.input.keyboard.on("keydown-W", () => {
        console.log("DEBUG: Instant Win triggered");
        this.triggerWin(winnerText);
      });

      this.input.keyboard.on("keydown-L", () => {
        console.log("DEBUG: Instant Lose triggered");
        this.triggerLose(gameOverText, hearts);
      });
    }

    // Enable input after cards finish animating
    this.time.addEvent({
      delay: 200 * this.cards.length,
      callback: () => {
        this.canMove = true;
      },
    });

    // Update cursor on hover
    this.pointerMoveHandler = (pointer) => {
      if (!this.canMove) {
        return;
      }

      const card = this.cards.find((card) => card.gameObject.hasFaceAt(pointer.x, pointer.y));
      if (card) {
        this.input.setDefaultCursor("pointer");
      } else {
        const objectsUnderPointer = this.input.hitTestPointer(pointer);
        const hasVolumeIcon = objectsUnderPointer.some((obj) => obj.name === "volume-icon");
        this.input.setDefaultCursor(hasVolumeIcon ? "pointer" : "default");
      }
    };
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.pointerMoveHandler);

    // Handle card clicks and matching logic
    this.pointerDownHandler = (pointer) => {
      if (this.canMove && this.cards.length) {
        const card = this.cards.find((card) => card.gameObject.hasFaceAt(pointer.x, pointer.y));

        if (card) {
          this.canMove = false;

          if (this.cardOpened !== undefined) {
            // Prevent clicking the same card twice
            if (
              this.cardOpened.gameObject.x === card.gameObject.x &&
              this.cardOpened.gameObject.y === card.gameObject.y
            ) {
              this.canMove = true;
              return false;
            }

            card.flip(() => {
              if (this.cardOpened.cardName === card.cardName) {
                // Cards match
                this.sound.play("card-match");

                this.cardOpened.destroy();
                card.destroy();

                this.cards = this.cards.filter((cardLocal) => cardLocal.cardName !== card.cardName);
                this.cardOpened = undefined;
                this.canMove = true;
              } else {
                // Cards don't match
                this.sound.play("card-mismatch");
                this.cameras.main.shake(600, 0.01);

                // Remove a life
                const lastHeart = hearts[hearts.length - 1];
                const heartRemoveTween = this.add.tween({
                  targets: lastHeart,
                  ease: Phaser.Math.Easing.Expo.InOut,
                  duration: 1000,
                  y: -1000,
                  onComplete: () => {
                    lastHeart.destroy();
                    hearts.pop();
                  },
                });
                this.activeTweens.push(heartRemoveTween);
                this.lives -= 1;

                // Flip both cards back
                card.flip();
                this.cardOpened.flip(() => {
                  this.cardOpened = undefined;
                  this.canMove = true;
                });
              }

              // Check for game over
              if (this.lives === 0) {
                this.sound.play("whoosh", { volume: 1.3 });
                const gameOverTween = this.add.tween({
                  targets: gameOverText,
                  ease: Phaser.Math.Easing.Bounce.Out,
                  y: this.sys.game.scale.height / 2,
                });
                this.activeTweens.push(gameOverTween);

                this.canMove = false;
              }

              // Check for win
              if (this.cards.length === 0) {
                this.sound.play("whoosh", { volume: 1.3 });
                this.sound.play("victory");

                const winnerTween = this.add.tween({
                  targets: winnerText,
                  ease: Phaser.Math.Easing.Bounce.Out,
                  y: this.sys.game.scale.height / 2,
                });
                this.activeTweens.push(winnerTween);
                this.canMove = false;
              }
            });
          } else if (this.cardOpened === undefined && this.lives > 0 && this.cards.length > 0) {
            // First card flipped
            card.flip(() => {
              this.canMove = true;
            });
            this.cardOpened = card;
          }
        }
      }
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.pointerDownHandler);

    // Winner text interactions
    winnerText.on(Phaser.Input.Events.POINTER_OVER, () => {
      winnerText.setColor(COLORS.WINNER_TEXT_HOVER);
      this.input.setDefaultCursor("pointer");
    });
    winnerText.on(Phaser.Input.Events.POINTER_OUT, () => {
      winnerText.setColor(COLORS.WINNER_TEXT);
      this.input.setDefaultCursor("default");
    });
    winnerText.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.sound.play("whoosh", { volume: 1.3 });
      const winnerHideTween = this.add.tween({
        targets: winnerText,
        ease: Phaser.Math.Easing.Bounce.InOut,
        y: -1000,
        onComplete: () => {
          this.restartGame();
        },
      });
      this.activeTweens.push(winnerHideTween);
    });

    // Game over text interactions
    gameOverText.on(Phaser.Input.Events.POINTER_OVER, () => {
      gameOverText.setColor(COLORS.GAME_OVER_TEXT_HOVER);
      this.input.setDefaultCursor("pointer");
    });

    gameOverText.on(Phaser.Input.Events.POINTER_OUT, () => {
      gameOverText.setColor(COLORS.GAME_OVER_TEXT);
      this.input.setDefaultCursor("default");
    });

    gameOverText.on(Phaser.Input.Events.POINTER_DOWN, () => {
      const gameOverHideTween = this.add.tween({
        targets: gameOverText,
        ease: Phaser.Math.Easing.Bounce.InOut,
        y: -1000,
        onComplete: () => {
          this.restartGame();
        },
      });
      this.activeTweens.push(gameOverHideTween);
    });
  }

  /**
   * Debug helper to instantly trigger win condition
   */
  triggerWin(winnerText) {
    // Clear all cards
    this.cards.forEach((card) => {
      if (card.gameObject && card.gameObject.scene) {
        card.gameObject.destroy();
      }
    });
    this.cards = [];

    this.sound.play("whoosh", { volume: 1.3 });
    this.sound.play("victory");

    const winnerTween = this.add.tween({
      targets: winnerText,
      ease: Phaser.Math.Easing.Bounce.Out,
      y: this.sys.game.scale.height / 2,
    });
    this.activeTweens.push(winnerTween);
    this.canMove = false;
  }

  /**
   * Debug helper to instantly trigger lose condition
   */
  triggerLose(gameOverText, hearts) {
    // Remove all hearts
    hearts.forEach((heart) => {
      if (heart && heart.scene) {
        heart.destroy();
      }
    });
    hearts.length = 0;
    this.lives = 0;

    this.sound.play("whoosh", { volume: 1.3 });
    const gameOverTween = this.add.tween({
      targets: gameOverText,
      ease: Phaser.Math.Easing.Bounce.Out,
      y: this.sys.game.scale.height / 2,
    });
    this.activeTweens.push(gameOverTween);
    this.canMove = false;
  }
}
