import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Phaser from 'phaser';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import WorkoutAgility from '~/scenes/workout-agilidad';

export class AgilidadFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): AbstractPoseTrackerScene {
    return new WorkoutAgility();
  }
}
