import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import FlexibilityWorkout from '~/workouts/arcade/flexibilityworkout';

export class FlexibilidadFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return new FlexibilityWorkout(scene);
  }
}
