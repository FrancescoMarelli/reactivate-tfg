import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { getAdjacentKeyPoints, Keypoint, Pose } from '@tensorflow-models/posenet';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import {
  IPoseTrackerRenderElementsSettings
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { POSE_CONNECTIONS } from '@mediapipe/pose/pose';
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



export function toTuple({ y, x }: { y: number; x: number }): [number, number] {
  return [y, x];
}


export function  drawPoint(ctx: CanvasRenderingContext2D, y: number, x: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function  drawSegment(
  [ay, ax]: [number, number],
  [by, bx]: [number, number],
  color: string,
  scale: number,
  ctx: CanvasRenderingContext2D
) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function  drawSkeleton(keypoints: Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale = 1) {
  const adjacentKeyPoints = getAdjacentKeyPoints(keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      'blue',
      scale,
      ctx
    );
  });
}

export function  drawKeypoints(keypoints: Keypoint[], minConfidence: number, ctx: CanvasRenderingContext2D, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, 'red');
  }
}






