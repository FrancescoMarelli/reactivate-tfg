import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose/pose';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils/drawing_utils';
import {
  IPoseTrackerRenderElementsSettings,
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { PoseDetector } from '~/pose-tracker-engine/adaptadores/pose-detector.interface';

export class MediapipePoseDetector implements PoseDetector {
  private pose: Pose;
  static showLandmarks: boolean = false;

  constructor() {
    this.pose = new Pose({
      locateFile: (file: string): string => `./vendor/@mediapipe/pose/${file}`,
    });
  }

  setOptions(options: any): void {
      this.pose.setOptions(options);
  }
  getPose(): Pose {
     return this.pose;
  }

  onResults(callback: (results: any) => void): void {
    this.pose.onResults(callback);
  }

  close(): void {
  }


  drawResults(
    ctx: CanvasRenderingContext2D,
    results: IPoseTrackerResults,
    renderElementsSettings?: IPoseTrackerRenderElementsSettings
  ): void {
    if (!ctx.canvas) {
      return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (renderElementsSettings?.shouldDrawFrame && results.image) {
      ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    if (renderElementsSettings?.shouldDrawPoseLandmarks && results.poseLandmarks) {
      ctx.save();
      if(MediapipePoseDetector.showLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#c4c4c4', lineWidth: 4 });
        drawLandmarks(ctx, results.poseLandmarks, { color: '#0051ff', lineWidth: 2 });
      }
      ctx.restore();
    }
  }

  shutdown(): void {
    document.querySelector('body > script[src$="pose_solution_packed_assets_loader.js"]')?.remove();
    document.querySelector('body > script[src$="pose_solution_wasm_bin.js"]')?.remove();
  }

  // @ts-ignore
  estimatePose(video: HTMLVideoElement): Promise<any> {
    // @ts-ignore
  }


}
