import { JumpinJackDetector } from '~/workouts/gym/jumpin-jack-detector';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class JumpingJackFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return new JumpinJackDetector(scene);
  }
}
