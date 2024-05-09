import { KeyPoint } from '~/pose-tracker-engine/types/adaptadores/keypoint.interface';

export interface IDetectPose {
  keypoints: KeyPoint[];
}
