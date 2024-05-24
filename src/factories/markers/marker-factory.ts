import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import { IMarkerFactory } from '~/factories/interfaces/marker-factory.interface';

export class MarkerFactory implements IMarkerFactory {
  create(scene: Phaser.Scene, config: any): Marker {
    const marker = new Marker({
      scene: scene,
      x: config.x,
      y: config.y,
      texture: config.texture || 'defaultMarker',
      id: config.id,
      defaultMarker: config.defaultMarker,
      defaultErrorMarker: config.defaultErrorMarker,
      flexibilityGame: config.flexibilityGame,
      agilityGame: config.agilityGame
    });

    if (config.animation) {
      marker.createAnimation(config.currentLevel);
    }

    return marker;
  }
}
