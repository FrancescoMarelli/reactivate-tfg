import { EPoseLandmark } from './pose-landmark.enum';
import { IPoseTrackerResults } from './pose-tracker-results.interface';
import PoseTracker from '~/pose-tracker-engine/pose-tracker';

class JumpDetector {
  private previousHipPosition: number;
  private jumpThreshold: number = 30; // altura en píxeles que consideramos un salto
  lastJumpTime: number;
  private jumpCooldown: number;

  constructor(private poseTracker: PoseTracker) {}

  update(poseResults: IPoseTrackerResults) {
    // @ts-ignore
    const leftHip = poseResults.poseLandmarks[EPoseLandmark.LeftHip];
    // @ts-ignore
    const rightHip = poseResults.poseLandmarks[EPoseLandmark.RightHip];

    if (leftHip && rightHip) {
      const currentHipPosition = (leftHip.y + rightHip.y) / 2;

      if (this.previousHipPosition != null) {
        const heightChange = this.previousHipPosition - currentHipPosition;

        if (heightChange > this.jumpThreshold) {
          console.log('Jump detected!');
          this.onJumpDetected();
        }
      }

      this.previousHipPosition = currentHipPosition;
    }
  }

  onJumpDetected() {

    console.log('Action to take on jump');
  }
  jumpDetected(): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastJumpTime > this.jumpCooldown) {
      this.lastJumpTime = currentTime;
      return true;
    }
    return false;
  }
}
