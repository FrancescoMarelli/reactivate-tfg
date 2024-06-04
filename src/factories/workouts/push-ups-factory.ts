import { PushUps } from '~/workouts/push-ups';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class PushUpsFactory implements IMovementFactory {
  create(scene: Phaser.Scene): IGymExercise {
    return new PushUps(scene)
  }
}
