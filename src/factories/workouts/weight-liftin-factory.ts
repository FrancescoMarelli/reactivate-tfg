import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { JumpinJackDetector } from '~/workouts/jumpin-jack-detector';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Constants from '~/constants';
import { WeigthLifting } from '~/workouts/weigth-lifting';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class WeightLiftinFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): IGymExercise {
    return  new WeigthLifting(scene);
  }
}
