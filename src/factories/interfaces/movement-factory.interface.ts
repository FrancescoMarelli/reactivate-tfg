import { IGymExercise } from '~/workouts/gym-exercise.interface';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';

export interface IMovementFactory {
  create(scene: Phaser.Scene, config: any): IGymExercise;
}
