import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { WeigthLifting } from '~/workouts/gym/weigth-lifting';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class WeightLiftinFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return  new WeigthLifting(scene);
  }
}
