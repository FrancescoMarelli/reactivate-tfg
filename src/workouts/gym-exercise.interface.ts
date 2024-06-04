import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Phaser from 'phaser';

export interface IGymExercise {
  isReady: boolean;
  scene: Phaser.Scene;
  getCounter();
  update(poseResults: IPoseTrackerResults): boolean;
  getType(): string;
}
