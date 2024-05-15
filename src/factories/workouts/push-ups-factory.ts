import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { PushUps } from '~/workouts/push-ups';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Constants from '~/constants';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class PushUpsFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): IGymExercise {
    return new PushUps(scene)
  }
}
