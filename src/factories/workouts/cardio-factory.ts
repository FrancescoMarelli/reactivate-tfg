import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import WorkoutCardio from '~/scenes/workout-cardio';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Menu from '~/scenes/menu';
import Constants from '~/constants';
import CardioWrkout from '~/workouts/cardioworkout';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { StaticLayoutFactory } from '~/factories/layout/static-layout-factory';
import CardioWorkout from '~/workouts/cardioworkout';

export class CardioFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): IGymExercise {
    return new CardioWorkout(scene);
  }
}
