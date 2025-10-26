/**
 * Create an interactive flip card for the memory game
 * @param {Phaser.Scene} scene - The Phaser scene instance
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} frontTexture - Texture key for card front
 * @param {string} cardName - Unique identifier for matching pairs
 * @returns {Object} Card object with flip, destroy methods and gameObject reference
 */
export const createCard = ({ scene, x, y, frontTexture, cardName }) => {
  let isFlipping = false;
  const rotation = { y: 0 };
  const activeTweens = [];

  const backTexture = "card-back";

  const card = scene.add.plane(x, y, backTexture).setName(cardName).setInteractive();

  // Start with the card face down
  card.modelRotationY = 180;

  const flipCard = (callbackComplete) => {
    if (isFlipping) {
      return;
    }
    const rotationTween = scene.add.tween({
      targets: [rotation],
      y: rotation.y === 180 ? 0 : 180,
      ease: Phaser.Math.Easing.Expo.Out,
      duration: 500,
      onStart: () => {
        isFlipping = true;
        scene.sound.play("card-flip");

        // Scale bounce effect
        const scaleTween = scene.tweens.chain({
          targets: card,
          ease: Phaser.Math.Easing.Expo.InOut,
          tweens: [
            {
              duration: 200,
              scale: 1.1,
            },
            {
              duration: 300,
              scale: 1,
            },
          ],
        });
        activeTweens.push(scaleTween);
      },
      onUpdate: () => {
        if (!card || !card.scene) {
          return;
        }

        // Update 3D rotation
        card.rotateY = 180 + rotation.y;
        const cardRotation = Math.floor(card.rotateY) % 360;

        // Switch texture at 90° rotation point
        if ((cardRotation >= 0 && cardRotation <= 90) || (cardRotation >= 270 && cardRotation <= 359)) {
          card.setTexture(frontTexture);
        } else {
          card.setTexture(backTexture);
        }
      },
      onComplete: () => {
        isFlipping = false;
        if (callbackComplete) {
          callbackComplete();
        }
      },
    });
    activeTweens.push(rotationTween);
  };

  const destroy = () => {
    // Stop active tweens
    activeTweens.forEach((tween) => {
      if (tween && !tween.isDestroyed()) {
        tween.stop();
      }
    });
    activeTweens.length = 0;

    if (!card || !card.scene) {
      return;
    }

    const destroyTween = scene.add.tween({
      targets: [card],
      y: card.y - 1000,
      easing: Phaser.Math.Easing.Elastic.In,
      duration: 500,
      onComplete: () => {
        if (card && card.scene) {
          card.destroy();
        }
      },
    });
    activeTweens.push(destroyTween);
  };

  return {
    gameObject: card,
    flip: flipCard,
    destroy,
    cardName,
  };
};
