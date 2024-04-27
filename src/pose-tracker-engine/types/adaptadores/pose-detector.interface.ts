import {
  IPoseTrackerRenderElementsSettings
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';

export interface PoseDetector {
  getPose(): any;
  setOptions: (options: any) => void;
  onResults: (callback: (results: any) => void) => void;
  close: () => void;
  shutdown: () => void;
  drawResults(ctx: CanvasRenderingContext2D, results: IPoseTrackerResults, renderElementsSettings?: IPoseTrackerRenderElementsSettings): void;
}
