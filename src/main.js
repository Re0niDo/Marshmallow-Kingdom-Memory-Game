import { Preloader } from './Preloader';
import { Play } from './Play';
import Phaser from 'phaser';

const config = {
    title: 'Marshmallow Kingdom Memory Game',
    type: Phaser.AUTO,
    width: 549,
    height: 480,
    parent: 'game-container',
    backgroundColor: '#8256BF',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Preloader,
        Play
    ]
};

new Phaser.Game(config);
