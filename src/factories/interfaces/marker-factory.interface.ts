import NewMarker from '~/gameobjects/new-marker';

export interface IMarkerFactory {
  create(scene: Phaser.Scene, config: any): NewMarker;
}
