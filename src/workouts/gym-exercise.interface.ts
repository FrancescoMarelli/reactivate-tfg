import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Marker from '~/gameobjects/marker';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';

export interface IGymExercise {
  getCounter();
  update(poseResults: IPoseTrackerResults): boolean;
  getType(): string;
}
