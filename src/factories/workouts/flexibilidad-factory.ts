import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import WorkoutFlexibilidad from '~/scenes/workout-flexibility';

export class FlexibilidadFactory implements  IMovementFactory {
  create(scene: Phaser.Scene, config: any): AbstractPoseTrackerScene {
    return new WorkoutFlexibilidad();
  }
}
