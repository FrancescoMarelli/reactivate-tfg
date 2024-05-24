import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';

export class WeigthLifting implements IGymExercise {

  private scene: Phaser.Scene;
  private rightState: 'down' | 'up';
  private leftState: 'down' | 'up';
  private counter = 0;
  public isReady: boolean;
  private botAngle: number;
  private topAngle: number;

  getCounter() {
    return this.counter;
  }


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.rightState = 'down';
    this.leftState = 'down';
    this.isReady = false;
      this.botAngle = 40;
      this.topAngle =  156;
  }
  update(poseResults: IPoseTrackerResults): boolean {
    if(!this.isReady) {
      return false;
    }

    const landmarks = poseResults.poseLandmarks;

    const leftShoulder = landmarks?.[EPoseLandmark.RightShoulder];
    const leftElbow = landmarks?.[EPoseLandmark.RightElbow];
    const leftWrist = landmarks?.[EPoseLandmark.RightWrist];

    const rightShoulder = landmarks?.[EPoseLandmark.LeftShoulder];
    const rightElbow = landmarks?.[EPoseLandmark.LeftElbow];
    const rightWrist = landmarks?.[EPoseLandmark.LeftWrist];

    if (leftShoulder && leftElbow && leftWrist && rightShoulder && rightElbow && rightWrist) {
      const angleLeftArm = AnglesUtils.calculateAngle(leftShoulder, leftElbow,  leftWrist);
      const angleRightArm = AnglesUtils.calculateAngle(rightShoulder, rightElbow, rightWrist);

      // Gym detection logic for left arm
      if (angleLeftArm >= this.topAngle && this.leftState == 'down') {
        this.leftState = 'up';
      }
      if (angleLeftArm <= this.botAngle && this.leftState == 'up') {
        this.leftState = 'down';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.counter++;
        console.log(this.counter + " Left Arm REPS");
      }

      // Gym detection logic for right arm
      if (angleRightArm >= this.topAngle && this.rightState == 'down') {
        this.rightState = 'up';
      }
      if (angleRightArm <= this.botAngle && this.rightState == 'up') {
        this.rightState = 'down';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.counter++;
        console.log(this.counter + " Right Arm REPS");
      }
    } else {
      console.error('Landmarks are missing');
    }
    return false;
  }

  getType(): string {
    return 'Gym';
  }
}
