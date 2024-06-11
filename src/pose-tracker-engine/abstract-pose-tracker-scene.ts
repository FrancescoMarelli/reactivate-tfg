import Phaser from 'phaser';
import PoseTracker from '~/pose-tracker-engine/pose-tracker';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { IOnPoseTrackerResultsUpdate } from '~/pose-tracker-engine/types/on-pose-tracker-results-update.interface';
import { NormalizedLandmark } from '@mediapipe/pose';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import ConfigScene from '~/scenes/config-scenes/config-scene';
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

    const weights = [0.2, 0.2, 0.2];
    const averagedLandmarks: IPoseLandmark[] = [];
    const numLandmarks = Object.keys(EPoseLandmark).length / 2;

    // Loop over each landmark
    for (let i = 0; i < numLandmarks; i++) {
      let sumX = 0, sumY = 0, sumZ = 0;
      let count = 0;

      //1. Calcular media de cada landmark de cada coordenada
      for (let j = 0; j < this.poseBuffer.length; j++) {
        const result = this.poseBuffer[j];
        if (result.poseLandmarks) {
          const landmark = result.poseLandmarks[i];
          if (landmark) {
            sumX += landmark.x;
            sumY += landmark.y;
            sumZ += landmark.z;
            count++;
          }
        }
      }

      // Salta si no hay landmark
      if (count === 0) continue;

      // Calcular media de cada coordenada
      const meanX = sumX / count;
      const meanY = sumY / count;
      const meanZ = sumZ / count;

      let varianceX = 0, varianceY = 0, varianceZ = 0;

      // 2. Calcula varianza de cada coordenada
      for (let j = 0; j < this.poseBuffer.length; j++) {
        const result = this.poseBuffer[j];
        if (result.poseLandmarks) {
          const landmark = result.poseLandmarks[i];
          if (landmark) {
            varianceX += Math.pow(landmark.x - meanX, 2);
            varianceY += Math.pow(landmark.y - meanY, 2);
            varianceZ += Math.pow(landmark.z - meanZ, 2);
          }
        }
      }

      // Calcular desviación estándar de cada coordenada
      const stdDevX = Math.sqrt(varianceX / count);
      const stdDevY = Math.sqrt(varianceY / count);
      const stdDevZ = Math.sqrt(varianceZ / count);

      let weightedSumX = 0, weightedSumY = 0, weightedSumZ = 0, weightedSumVisibility = 0;
      let validWeightsSum = 0;

      // 3. Calcula la media ponderada de cada coordenada de cada landmark considerando la visibilidad
      for (let j = 0; j < this.poseBuffer.length; j++) {
        const result = this.poseBuffer[j];
        if (result.poseLandmarks) {
          const landmark = result.poseLandmarks[i];
          if (landmark) {
            let weight = weights[j];
            // Desminuir Peso si no tiene score
            if (landmark.visibility < 0.2) {
              weight *= landmark.visibility;
            }
            // Si el landmark está dentro de 2 desviaciones estándar de la media, considerarlo válido
            if (Math.abs(landmark.x - meanX) <= 4 * stdDevX &&
              Math.abs(landmark.y - meanY) <= 4 * stdDevY &&
              Math.abs(landmark.z - meanZ) <= 4 * stdDevZ) {
              weightedSumX += landmark.x * weight;
              weightedSumY += landmark.y * weight;
              weightedSumZ += landmark.z * weight;
              weightedSumVisibility += (landmark.visibility ?? 0) * weight;
              validWeightsSum += weight;
            }
          }
        }
      }

      //Calcula media final
      averagedLandmarks[i] = {
        x: weightedSumX / validWeightsSum,
        y: weightedSumY / validWeightsSum,
        z: weightedSumZ / validWeightsSum,
        visibility: weightedSumVisibility / validWeightsSum,
      };
    }

    // Return the smoothed results
    return {
      ...this.poseBuffer[this.poseBuffer.length - 1],
      poseLandmarks: averagedLandmarks.map(this.convertToIPoseLandmark),
    };
  }

  convertToIPoseLandmark(normalizedLandmark: NormalizedLandmark): IPoseLandmark {
    return {
      x: normalizedLandmark.x,
      y: normalizedLandmark.y,
      z: normalizedLandmark.z,
      visibility: normalizedLandmark.visibility || 0
    };
  }

}
