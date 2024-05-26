import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';

export class PushUps implements IGymExercise {
  private scene: Phaser.Scene;
  private state: 'up' | 'down';
  private counter: number = 0;
  public isReady: boolean;
  public show: boolean;

  private leftTopAngleText: Phaser.GameObjects.Text;
  private rightBotAngleText: Phaser.GameObjects.Text;
  private leftBotAngleText: Phaser.GameObjects.Text;
  private rightTopAngleText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = 'down';
    this.show = false;
    this.isReady = false;
    this.leftBotAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle: 'bold', fontSize: '40px' });
    this.leftTopAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle: 'bold', fontSize: '40px' });
    this.rightTopAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle: 'bold', fontSize: '40px' });
    this.rightBotAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle: 'bold', fontSize: '40px' });
  }

  getType(): string {
    return 'Gym';
  }

  getCounter() {
    return this.counter;
  }

  update(poseResults: IPoseTrackerResults): boolean {
    if (!this.isReady) {
      return false;
    }

    const landmarks = poseResults.poseLandmarks;
    if (!landmarks) return false;

    const leftShoulder = landmarks[EPoseLandmark.RightShoulder];
    const rightShoulder = landmarks[EPoseLandmark.LeftShoulder];
    const leftElbow = landmarks[EPoseLandmark.RightElbow];
    const rightElbow = landmarks[EPoseLandmark.LeftElbow];
    const leftHip = landmarks[EPoseLandmark.RightHip];
    const rightHip = landmarks[EPoseLandmark.LeftHip];
    const leftWrist = landmarks[EPoseLandmark.RightWrist];
    const rightWrist = landmarks[EPoseLandmark.LeftWrist];

    const leftAlignement = Math.abs(leftShoulder.y - leftHip.y);
    const rightAlignement = Math.abs(rightShoulder.y - rightHip.y);

    // Check if the user is horizontal
    const isHorizontal = (leftAlignement < 0.4 || rightAlignement < 0.4);

    // Calculate the distance between the shoulder and wrist for both arms
    const rightShoulderWristDistance = this.distanceCalculate(rightShoulder, rightWrist);
    const leftShoulderWristDistance = this.distanceCalculate(leftShoulder, leftWrist);

    // Check if the arms are extended or bent
    const areArmsExtended = (rightShoulderWristDistance < 0.3 && leftShoulderWristDistance < 0.3);
    const areArmsBent = (rightShoulderWristDistance > 0.4 && leftShoulderWristDistance > 0.4);

    const leftElbowPixel = { x: leftElbow.x * this.scene.scale.width, y: leftElbow.y * this.scene.scale.height };
    const leftShoulderPixel = { x: leftShoulder.x * this.scene.scale.width, y: leftShoulder.y * this.scene.scale.height };
    const rightElbowPixel = { x: rightElbow.x * this.scene.scale.width, y: rightElbow.y * this.scene.scale.height };
    const rightShoulderPixel = { x: rightShoulder.x * this.scene.scale.width, y: rightShoulder.y * this.scene.scale.height };


    const leftArmAngle = AnglesUtils.calculateAngle(leftShoulder, leftElbow, leftWrist);
    const leftShoulderAngle = AnglesUtils.calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightArmAngle = AnglesUtils.calculateAngle(rightShoulder, rightElbow, rightWrist);
    const rightShoulderAngle = AnglesUtils.calculateAngle(rightHip, rightShoulder, rightElbow);

    if(MediapipePoseDetector.showLandmarks) {
      this.leftBotAngleText.setText(` ${leftShoulderAngle?.toFixed(0)}`);
      this.leftBotAngleText.setPosition(leftShoulderPixel.x, leftShoulderPixel.y);
      this.leftTopAngleText.setText(` ${leftArmAngle?.toFixed(0)}`);
      this.leftTopAngleText.setPosition(leftElbowPixel.x, leftElbowPixel.y);

      this.rightTopAngleText.setText(`${rightShoulderAngle?.toFixed(0)}`);
      this.rightTopAngleText.setPosition(rightShoulderPixel.x, rightShoulderPixel.y);
      this.rightBotAngleText.setText(`${rightArmAngle?.toFixed(0)}`);
      this.rightBotAngleText.setPosition(rightElbowPixel.x, rightElbowPixel.y);
    } else {
      this.leftBotAngleText.setText('');
      this.leftTopAngleText.setText('');
      this.rightTopAngleText.setText('');
      this.rightBotAngleText.setText('');
    }

    if (this.state === 'down' && isHorizontal && areArmsExtended) {
      this.state = 'up';
      this.scene.events.emit(Constants.EVENT.UPDATE_HALF); // Emit event at halfway point
    } else if (this.state === 'up' && isHorizontal && areArmsBent) {
      this.state = 'down';
      this.counter++;
      this.scene.events.emit(Constants.EVENT.COUNTER); // Emit the event using the scene property
      console.log(`${this.counter} PushUps`);
    }
    return false;
  }

  private distanceCalculate(p1: any, p2: any): number {
    const dis = ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) ** 0.5;
    return dis;
  }
}
