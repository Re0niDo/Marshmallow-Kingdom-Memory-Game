/**
 * Create a card game object
 */
export const createCard = ({ scene, x, y, frontTexture, cardName }) => {
  let isFlipping = false;
  const rotation = { y: 0 };
  const activeTweens = []; // Track all tweens for cleanup

  const backTexture = "card-back";

  const card = scene.add.plane(x, y, backTexture).setName(cardName).setInteractive();

  // start with the card face down
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
        // Check if card still exists before updating
        if (!card || !card.scene) {
          return;
        }
        card.rotateY = 180 + rotation.y;
        const cardRotation = Math.floor(card.rotateY) % 360;
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
    // Stop all active tweens before destroying
    activeTweens.forEach((tween) => {
      if (tween && !tween.isDestroyed()) {
        tween.stop();
      }
    });
    activeTweens.length = 0;

    // Check if card still exists
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
