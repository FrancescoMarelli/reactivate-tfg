import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { getAdjacentKeyPoints, Keypoint, Pose } from '@tensorflow-models/posenet';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';


// Mapa de índices PoseNet a MediaPipe
const poseNetToMediaPipeMap: { [key: string]: EPoseLandmark } = {
  'nose': EPoseLandmark.Nose,
  'leftEye': EPoseLandmark.LeftEye,
  'rightEye': EPoseLandmark.RightEye,
  'leftEar': EPoseLandmark.LeftEar,
  'rightEar': EPoseLandmark.RightEar,
  'leftShoulder': EPoseLandmark.LeftShoulder,
  'rightShoulder': EPoseLandmark.RightShoulder,
  'leftElbow': EPoseLandmark.LeftElbow,
  'rightElbow': EPoseLandmark.RightElbow,
  'leftWrist': EPoseLandmark.LeftWrist,
  'rightWrist': EPoseLandmark.RightWrist,
  'leftHip': EPoseLandmark.LeftHip,
  'rightHip': EPoseLandmark.RightHip,
  'leftKnee': EPoseLandmark.LeftKnee,
  'rightKnee': EPoseLandmark.RightKnee,
  'leftAnkle': EPoseLandmark.LeftAnkle,
  'rightAnkle': EPoseLandmark.RightAnkle,
};
export function mapKeypointsToLandmarks(pose: Pose): IPoseLandmark[] {
  const landmarks: IPoseLandmark[] = Array(Object.keys(EPoseLandmark).length / 2).fill(null);

  pose.keypoints.forEach((keypoint: Keypoint) => {
    const mediaPipeLandmark = poseNetToMediaPipeMap[keypoint.part];

    if (mediaPipeLandmark !== undefined) {
      landmarks[mediaPipeLandmark] = {
        x: keypoint.position.x,
        y: keypoint.position.y,
        z: 0,
        visibility: keypoint.score,
      };
    }
  });

  return landmarks;
}



