import Phaser from 'phaser';
import NewMarker from '~/gameobjects/new-marker';
import { IMarkerFactory } from '~/factories/interfaces/marker-factory.interface';

export interface ILayoutFactory {
  markers : NewMarker[];
  markerFactory : IMarkerFactory;
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[], detectorExercise: any, markerType: string): NewMarker[];
}
