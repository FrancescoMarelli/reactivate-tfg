import Marker from '~/gameobjects/marker';
import Phaser from 'phaser';

export interface ILayoutFactory {
  markers : Marker[];
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[], detectorExercise: any): Marker[];
}
