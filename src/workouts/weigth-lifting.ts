import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';

export class WeigthLifting implements IGymExercise {

  private scene: Phaser.Scene;
  private rightState: 'down' | 'up';
  private leftState: 'down' | 'up';
  private counter = 0;
  public isReady: boolean;
  private closeAngle: number;
  private openAngle: number;

  private leftAngleText: Phaser.GameObjects.Text;
  private rightAngleText: Phaser.GameObjects.Text;


  getCounter() {
    return this.counter;
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.rightState = 'down';
    this.leftState = 'down';
    this.isReady = false;
    this.closeAngle = 60;
    this.openAngle =  125;
    this.leftAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });
    this.rightAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });
  }
  update(poseResults: IPoseTrackerResults): boolean {
    if(!this.isReady) {
      return false;
    }

    const landmarks = poseResults.poseLandmarks;

    if(!landmarks) return false;


    const leftShoulder = landmarks?.[EPoseLandmark.RightShoulder];
    const leftElbow = landmarks?.[EPoseLandmark.RightElbow];
    const leftWrist = landmarks?.[EPoseLandmark.RightWrist];

    const rightShoulder = landmarks?.[EPoseLandmark.LeftShoulder];
    const rightElbow = landmarks?.[EPoseLandmark.LeftElbow];
    const rightWrist = landmarks?.[EPoseLandmark.LeftWrist];

    const leftArmPixel = {x: leftElbow.x * this.scene.scale.width, y : leftElbow.y * this.scene.scale.height};
    const rightArmPixel = { x: rightElbow.x * this.scene.scale.width, y : rightElbow.y * this.scene.scale.height};

    if (leftShoulder && leftElbow && leftWrist && rightShoulder && rightElbow && rightWrist &&
      leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5 && leftWrist.visibility > 0.5
      && rightShoulder.visibility > 0.5 && rightElbow.visibility > 0.5 && rightWrist.visibility > 0.5) {
      const angleLeftArm = AnglesUtils.calculateAngle(leftShoulder, leftElbow,  leftWrist);
      const angleRightArm = AnglesUtils.calculateAngle(rightShoulder, rightElbow, rightWrist);

      if(MediapipePoseDetector.showLandmarks) {
        this.leftAngleText.setText(` ${angleLeftArm?.toFixed(0)}`);
        this.leftAngleText.setPosition(leftArmPixel.x, leftArmPixel.y);
        this.rightAngleText.setText(`${angleRightArm?.toFixed(0)}`)
        this.rightAngleText.setPosition(rightArmPixel.x, rightArmPixel.y);
      } else {
        // Clear the angle text when Show Landmarks is off
        this.leftAngleText.setText('');
        this.rightAngleText.setText('');
      }

      // Gym detection logic for left arm
      if (angleLeftArm >= this.openAngle && this.leftState == 'down') {
        this.leftState = 'up';
        this.scene.events.emit(Constants.EVENT.UPDATE_HALF);
      }
      if (angleLeftArm <= this.closeAngle && this.leftState == 'up') {
        this.leftState = 'down';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.counter++;
        console.log(this.counter + " Left Arm REPS");
      }

      // Gym detection logic for right arm
      if (angleRightArm >= this.openAngle && this.rightState == 'down') {
        this.rightState = 'up';
        this.scene.events.emit(Constants.EVENT.UPDATE_HALF);
      }
      if (angleRightArm <= this.closeAngle && this.rightState == 'up') {
        this.rightState = 'down';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.counter++;
        console.log(this.counter + " Right Arm REPS");
      }
    } else {
      console.error('Landmarks are missing or pose detection is unstable');
    }
    return false;
  }

  getType(): string {
    return 'Gym';
  }
}
