import { IGymExercise } from '~/workouts/gym-exercise.interface';

export interface IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise;
}
