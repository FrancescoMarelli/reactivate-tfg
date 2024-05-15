import Phaser from 'phaser';

export interface ISoundFactory {
  create(scene: Phaser.Scene, config: any): Phaser.Sound.BaseSound;
}
