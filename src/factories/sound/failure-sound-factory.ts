import Phaser from 'phaser';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';

export class FailureSoundFactory implements ISoundFactory {
  create(scene: Phaser.Scene, config: any): Phaser.Sound.BaseSound {
    const sound = scene.sound.add(config.failureSound, {
      volume: config.volume,
      loop: config.loop
    });
    sound.play();
    return sound;
  }
}
