import Marker from '~/gameobjects/marker';
import Phaser from 'phaser';

export interface ILayoutFactory {
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[]): Marker[];
}
