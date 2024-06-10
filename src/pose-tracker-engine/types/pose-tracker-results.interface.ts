import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { Keypoint } from '@tensorflow-models/posenet';

export interface IPoseTrackerResults {
  image: CanvasImageSource;
  poseLandmarks?: IPoseLandmark[];
}
