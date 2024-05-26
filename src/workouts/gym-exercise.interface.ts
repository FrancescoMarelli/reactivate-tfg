import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';

export interface IGymExercise {
  getCounter();
  update(poseResults: IPoseTrackerResults): boolean;
  getType(): string;
}
