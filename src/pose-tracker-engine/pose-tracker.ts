import { IPoseSettings } from '~/pose-tracker-engine/types/pose-settings.interface';
import { ISize } from '~/types/size.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Camera from '~/pose-tracker-engine/camera';
import {
  IPoseTrackerRenderElementsSettings,
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { PoseDetector } from '~/pose-tracker-engine/types/adaptadores/pose-detector.interface';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';

export default class PoseTracker {
  private pose: PoseDetector;
  private camera: Camera | null;

  constructor(
    videoEl: HTMLVideoElement | null,
    settings: IPoseSettings & ISize,
    onResults: (results: IPoseTrackerResults) => void,
  ) {
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.id = 'input-video';
    }

    // This is for clearing any existing cache from the video element
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();

    this.pose = new MediapipePoseDetector();

    this.pose.setOptions(settings);
    this.pose.onResults(onResults);
    this.camera = new Camera(
      videoEl,
      async (): Promise<void> => {
        await this.pose.getPose()?.send({ image: videoEl });
      },
    );
    this.camera.start(settings.width, settings.height);
  }

  public shutdown(): void {
    this.pose.shutdown();
    this.camera?.stop();
    this.camera = null;
    this.pose.close();
    // @ts-ignore
    this.pose = null;
  }

  public drawResults(
    ctx: CanvasRenderingContext2D,
    results: IPoseTrackerResults,
    renderElementsSettings?: IPoseTrackerRenderElementsSettings,
  ): void {
    this.pose.drawResults(ctx,results,renderElementsSettings);
  }
}
