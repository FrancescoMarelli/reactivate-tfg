import { IPoseSettings } from '~/pose-tracker-engine/types/pose-settings.interface';
import { ISize } from '~/types/size.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Camera from '~/pose-tracker-engine/camera';
import {
  IPoseTrackerRenderElementsSettings,
} from '~/pose-tracker-engine/types/pose-tracker-dender-elements-settings.interface';
import { mapKeypointsToLandmarks } from '~/pose-tracker-engine/utils';
import { PoseDetector } from '~/pose-tracker-engine/adaptadores/pose-detector.interface';
import { MediapipePoseDetector } from '~/pose-tracker-engine/adaptadores/mediapipe-pose-detector';
import PosenetDetector from '~/pose-tracker-engine/adaptadores/posenet-detector';
import ConfigScene from '~/scenes/config-scenes/config-scene';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import Loader from '~/scenes/loader';

export default class PoseTracker {
  private pose: PoseDetector;
  private camera: Camera | null;
  private isDetectingPose: boolean; // New state variable


  constructor(
    videoEl: HTMLVideoElement | null,
    settings: IPoseSettings & ISize,
    onResults: (results: IPoseTrackerResults) => void,
  ) {
    this.isDetectingPose = false; // Initialize state variable

    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.id = 'input-video';
    }

    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();

    if (Loader._usingPoseNet) {
      this.initPoseNet(videoEl, onResults);
    } else {
     this.initMediapipe(videoEl, onResults, settings);
    }
    this.camera.start(settings.width, settings.height);
  }

  initPoseNet(videoEl: HTMLVideoElement | null,  onResults: (results: IPoseTrackerResults) => void): void {
    this.pose = new PosenetDetector();
    this.camera = new Camera(
      videoEl,
      async (): Promise<void> => {
        if (videoEl && !this.isDetectingPose) {
          this.isDetectingPose = true;
          const pose = await this.pose.estimatePose(videoEl);
          if (pose) {
            const landmarks = mapKeypointsToLandmarks(pose);
            const results: IPoseTrackerResults = { image: videoEl, poseLandmarks: landmarks };
            onResults(results);
          }
          this.isDetectingPose = false;
        }
      },
    );
  }

initMediapipe(videoEl: HTMLVideoElement | null,  onResults: (results: IPoseTrackerResults) => void,  settings: IPoseSettings & ISize ): void {
    this.pose = new MediapipePoseDetector();
    this.pose.setOptions(settings);
    this.pose.onResults(onResults);
    this.camera = new Camera(
      videoEl,
      async (): Promise<void> => {
        await this.pose.getPose()?.send({ image: videoEl });
      },
    );
  }



  public shutdown(): void {
    this.pose.shutdown();
    this.camera?.stop();
    this.camera = null;
    //this.pose.close();
    // @ts-ignore
    this.pose = null;
  }

  public drawResults(
    ctx: CanvasRenderingContext2D,
    results: IPoseTrackerResults,
    renderElementsSettings?: IPoseTrackerRenderElementsSettings,
  ): void {
    if (renderElementsSettings) {
      this.pose.drawResults(ctx, results, renderElementsSettings);
    }
  }
}
