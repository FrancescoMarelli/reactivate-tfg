import * as posenet from '@tensorflow-models/posenet';
import { PoseNet } from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import {
  IPoseTrackerRenderElementsSettings,
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { flipPoseHorizontal } from '@tensorflow-models/posenet/dist/util';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose/pose';
import { drawKeypoints, drawSkeleton } from '~/pose-tracker-engine/utils';


export default class PosenetDetector {
  private net: posenet.PoseNet | null = null;
  private modelLoaded: Promise<void>;
  private width = 1280;
  private height = 720;
  public scaledKeypoints: posenet.Keypoint[] | null = null; // Nuevo campo para almacenar los keypoints escalados


  constructor() {
    tf.setBackend('webgl'); // or 'wasm' or 'cpu'
    this.modelLoaded = this.loadModel();
  }

  private async loadModel() {
    this.net = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: this.width, height: this.height },
      multiplier: 0.5
    });
  }

  public getPose(): PoseNet | null {
    return this.net;
  }

  public async estimatePose(video: HTMLVideoElement): Promise<posenet.Pose | null> {
    return new Promise(async (resolve, reject) => {
      // Espera a que el video esté listo antes de estimar la pose
      if (this.net) {
        video.setAttribute('width', this.width.toString());
        video.setAttribute('height', this.height.toString());
        let pose = await this.net.estimateSinglePose(video, {
          flipHorizontal: false
        });

      if (pose) {
              // Escalar las coordenadas de los landmarks al tamaño del canvas
          const scaledKeypoints = pose.keypoints.map((keypoint) => {
            return {
              ...keypoint,
              position: {
                x: keypoint.position.x /1280,
                y: keypoint.position.y/720
              },
              visibility: keypoint.score
            };
          });

          resolve({
            ...pose,
            keypoints: scaledKeypoints
          });
        }
       resolve(null);
      };

      // Si hay un error al cargar el video, rechaza la promesa
      video.onerror = (error) => {
        reject(error);
      };
    });
  }

  public shutdown(): void {
    this.net = null;
  }

  public drawResults(
    ctx: CanvasRenderingContext2D,
    results: IPoseTrackerResults,
    renderElementsSettings: IPoseTrackerRenderElementsSettings
  ): void {
    if (!results || !ctx) {
      return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (renderElementsSettings.shouldDrawFrame && results.image) {
      ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    if (renderElementsSettings.shouldDrawPoseLandmarks && results.poseLandmarks) {
      ctx.save();
      if(MediapipePoseDetector.showLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#c4c4c4', lineWidth: 4 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#0051ff', lineWidth: 2 });
      }
      ctx.restore();

    }
  }
}
