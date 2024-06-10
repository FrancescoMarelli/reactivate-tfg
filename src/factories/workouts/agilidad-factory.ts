import AgilityWorkout from '~/workouts/arcade/agilityworkout';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';

export class AgilidadFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return new AgilityWorkout(scene);
  }
}
