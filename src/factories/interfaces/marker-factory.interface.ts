import Marker from '~/gameobjects/marker';

export interface IMarkerFactory {
  create(scene: Phaser.Scene, config: any): Marker;
}
