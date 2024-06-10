import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import CardioWorkout from '~/workouts/arcade/cardioworkout';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class CardioFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return new CardioWorkout(scene);
  }
}
