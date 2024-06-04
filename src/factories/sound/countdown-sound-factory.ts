import Phaser from 'phaser';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';

export class CountdownSoundFactory implements ISoundFactory {
  create(scene: Phaser.Scene, config: any): Phaser.Sound.BaseSound {
    const sound = scene.sound.add(config.countDownSound, {
      volume: config.volume,
      loop: config.loop
    });
    sound.play();
    return sound;
  }
}
