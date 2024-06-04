import Phaser from 'phaser';
import { IMarkerFactory } from '~/factories/interfaces/marker-factory.interface';
import NewMarker from '~/gameobjects/new-marker';

export class MarkerFactory implements IMarkerFactory {
  create(scene: Phaser.Scene, config: any): NewMarker {
    const marker = new NewMarker({
      scene: scene,
      x: config.x,
      y: config.y,
      texture: config.texture,
      id: config.id,
      defaultMarker: config.defaultMarker,
      defaultErrorMarker: config.defaultErrorMarker,
      flexibilityGame: config.flexibilityGame,
      agilityGame: config.agilityGame
    });
    return marker;
  }
}
