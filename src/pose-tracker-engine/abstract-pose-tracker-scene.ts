import Phaser from 'phaser';
import PoseTracker from '~/pose-tracker-engine/pose-tracker';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { IOnPoseTrackerResultsUpdate } from '~/pose-tracker-engine/types/on-pose-tracker-results-update.interface';
import { NormalizedLandmark } from '@mediapipe/pose';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import Loader from '~/scenes/loader';

export default abstract class AbstractPoseTrackerScene extends Phaser.Scene {
  private poseTrackerCanvasTexture!: Phaser.Textures.CanvasTexture;
  private poseTracker!: PoseTracker;
  private poseTrackerResults: IPoseTrackerResults | undefined;
  private poseBuffer: IPoseTrackerResults[] = [];
  private static readonly BUFFER_SIZE = 3;  // Tamaño del buffer reducido para menos retraso
  private count : number = 0;
  private lastUpdateTime: number = 0;


  protected constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
  }

  preload(): void {
    this.poseTracker = new PoseTracker(
      document.querySelector('#input-video'),
      {
        width: this.scale.width,
        height: this.scale.height,
        selfieMode: true,
        upperBodyOnly: false,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      },
      (results: IPoseTrackerResults) => (this.poseTrackerResults = results),
    );

    // Create a texture canvas to draw the camera frames/joints on it later
    this.poseTrackerCanvasTexture = this.textures.createCanvas('camera-frame', this.scale.width, this.scale.height);
    if(Loader._usingPoseNet) {
      this.poseTrackerCanvasTexture.context.scale(-1, 1);
      this.poseTrackerCanvasTexture.context.translate(-this.poseTrackerCanvasTexture.width, 0);
    }
  }

  create(): void {
    // Add the texture to the scene for render
    this.add.image(0, 0, this.poseTrackerCanvasTexture).setOrigin(0, 0);

    // Clean resources/free camera acquisition when exit from the scene
    this.events.once('shutdown', () => {
      this.textures.remove('camera-frame');
      this.poseTracker.shutdown();
      this.poseTrackerResults = undefined;
    });
  }

  update(time: number, delta: number, onPoseTrackerResultsUpdate?: IOnPoseTrackerResultsUpdate): void {
    /*  this.count++;
      if (time - this.lastUpdateTime > 1000) {
        console.log(`El método update se ha llamado ${this.count} veces en el último segundo.`);
        this.count = 0;
        this.lastUpdateTime = time;
      }*/

    if (!this.poseTrackerResults) {
      return;
    }

    // Agregar los resultados actuales al buffer
    this.poseBuffer.push(this.poseTrackerResults);
    if (this.poseBuffer.length > AbstractPoseTrackerScene.BUFFER_SIZE) {
      this.poseBuffer.shift();
    }

    // Obtener resultados suavizados
    const smoothedResults = this.getSmoothedResults();

    if (this.poseTrackerCanvasTexture && this.poseTrackerCanvasTexture.context) {
      this.poseTracker.drawResults(
        this.poseTrackerCanvasTexture.context,
        smoothedResults,
        onPoseTrackerResultsUpdate?.renderElementsSettings,
      );

      onPoseTrackerResultsUpdate?.beforePaint(smoothedResults, this.poseTrackerCanvasTexture);
      this.poseTrackerCanvasTexture.refresh();
      onPoseTrackerResultsUpdate?.afterPaint(smoothedResults);
    }

    // Set it to undefined to not draw anything again until new pose tracker results are obtained
    this.poseTrackerResults = undefined;
  }

  private getSmoothedResults(): IPoseTrackerResults {
    if (this.poseBuffer.length === 0) {
      return this.poseTrackerResults as IPoseTrackerResults;
    }

    const weights = [0.5, 0.4, 0.3];
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const averagedLandmarks: IPoseLandmark[] = [];
    for (let i = 0; i < Object.keys(EPoseLandmark).length / 2; i++) {
      let weightedSumX = 0;
      let weightedSumY = 0;
      let weightedSumZ = 0;
      let weightedSumVisibility = 0;

      // Iterrar sobre los resultados en el buffer y calcular el promedio ponderado
      for (let j = 0; j < this.poseBuffer.length; j++) {
        const result = this.poseBuffer[j];
        if (result.poseLandmarks) {
          const landmark = result.poseLandmarks[i];
          if (landmark) {
            const weight = weights[j];
            weightedSumX += landmark.x * weight;
            weightedSumY += landmark.y * weight;
            weightedSumZ += landmark.z * weight;
            weightedSumVisibility += (landmark.visibility ?? 0) * weight;
          }
        }
      }

      // Calcular  el promedio ponderado
      averagedLandmarks[i] = {
        x: weightedSumX / totalWeight,
        y: weightedSumY / totalWeight,
        z: weightedSumZ / totalWeight,
        visibility: weightedSumVisibility / totalWeight,
      };

    }

    return {
      ...this.poseBuffer[this.poseBuffer.length - 1],
      poseLandmarks: averagedLandmarks.map(this.convertToIPoseLandmark),
    };
  }

  // Normalizo para visibilidad
  convertToIPoseLandmark(normalizedLandmark: NormalizedLandmark): IPoseLandmark {
    return {
      x: normalizedLandmark.x,
      y: normalizedLandmark.y,
      z: normalizedLandmark.z,
      visibility: normalizedLandmark.visibility || 0
    };
  }
}
