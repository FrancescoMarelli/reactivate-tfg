import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/utils/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { MediapipePoseDetector } from '~/pose-tracker-engine/adaptadores/mediapipe-pose-detector';
import { NormalizedLandmark } from '@mediapipe/pose';

export class PushUps implements IGymExercise {
  scene: Phaser.Scene;
  private state: 'up' | 'down';
  private counter: number = 0;
  isReady: boolean = false;
  public show: boolean;

  private leftTopAngleText: Phaser.GameObjects.Text;
  private rightBotAngleText: Phaser.GameObjects.Text;
  private leftBotAngleText: Phaser.GameObjects.Text;
  private rightTopAngleText: Phaser.GameObjects.Text;

  private static HORIZONTAL_TOLERANCE = 0.3;  // Tolerance for horizontal alignment
  private static MIN_CONFIDENCE = 0.4;  // Minimum confidence for keypoints to be considered valid

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

    if (!landmarks) {
      this.clearTexts();
      return false;
    }

    const leftShoulder = landmarks[EPoseLandmark.RightShoulder];
    const rightShoulder = landmarks[EPoseLandmark.LeftShoulder];
    const leftElbow = landmarks[EPoseLandmark.RightElbow];
    const rightElbow = landmarks[EPoseLandmark.LeftElbow];
    const leftHip = landmarks[EPoseLandmark.RightHip];
    const rightHip = landmarks[EPoseLandmark.LeftHip];
    const leftWrist = landmarks[EPoseLandmark.RightWrist];
    const rightWrist = landmarks[EPoseLandmark.LeftWrist];

    // Verificar la confianza de los puntos clave
    const leftVisible = this.areKeypointsValid([leftShoulder, leftElbow, leftWrist, leftHip]);
    const rightVisible = this.areKeypointsValid([rightShoulder, rightElbow, rightWrist, rightHip]);

      const leftArmAngle = AnglesUtils.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const leftShoulderAngle = AnglesUtils.calculateAngle(leftHip, leftShoulder, leftElbow);
     const rightArmAngle = AnglesUtils.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const rightShoulderAngle = AnglesUtils.calculateAngle(rightHip, rightShoulder, rightElbow);


    const leftElbowPixel = { x: leftElbow.x * this.scene.scale.width, y: leftElbow.y * this.scene.scale.height };
    const leftShoulderPixel = { x: leftShoulder.x * this.scene.scale.width, y: leftShoulder.y * this.scene.scale.height };
    const rightElbowPixel = { x: rightElbow.x * this.scene.scale.width, y: rightElbow.y * this.scene.scale.height };
    const rightShoulderPixel = { x: rightShoulder.x * this.scene.scale.width, y: rightShoulder.y * this.scene.scale.height };

    if (MediapipePoseDetector.showLandmarks) {
      this.leftBotAngleText.setText(` ${leftShoulderAngle?.toFixed(0)}`);
      this.leftBotAngleText.setPosition(leftShoulderPixel.x, leftShoulderPixel.y);
      this.leftTopAngleText.setText(` ${leftArmAngle?.toFixed(0)}`);
      this.leftTopAngleText.setPosition(leftElbowPixel.x, leftElbowPixel.y);

      this.rightTopAngleText.setText(`${rightShoulderAngle?.toFixed(0)}`);
      this.rightTopAngleText.setPosition(rightShoulderPixel.x, rightShoulderPixel.y);
      this.rightBotAngleText.setText(`${rightArmAngle?.toFixed(0)}`);
      this.rightBotAngleText.setPosition(rightElbowPixel.x, rightElbowPixel.y);
    } else {
      this.clearTexts();
    }

    const isHorizontal = this.isHorizontallyAligned(leftShoulder, rightShoulder, leftHip, rightHip);

    if(leftVisible && rightVisible) {
      console.log("No se detectan puntos clave");
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

      if (this.state === 'down' && isHorizontal && areArmsExtended) {
        this.state = 'up';
        this.scene.events.emit(Constants.EVENT.UPDATE_HALF); // Emit event at halfway point
      } else if (this.state === 'up' && isHorizontal && areArmsBent) {
        this.state = 'down';
        this.counter++;
        this.scene.events.emit(Constants.EVENT.COUNTER); // Emit the event using the scene property
        this.scene.events.emit(Constants.EVENT.FULL)
        console.log(`${this.counter} PushUps`);
      }
    } else {
      if (this.state === 'down' && isHorizontal) {
        if ((leftVisible && leftArmAngle > 130 && this.isAngleInRange(leftShoulderAngle, 0, 90)) ||
          (rightVisible && rightArmAngle > 130 && this.isAngleInRange(rightShoulderAngle, 0, 90))) {
          this.state = 'up';
          this.scene.events.emit(Constants.EVENT.UPDATE_HALF);
        }
      }

      if (this.state === 'up' && isHorizontal &&
        ((leftVisible && leftArmAngle < 90 && this.isAngleInRange(leftShoulderAngle, -30, 30)) ||
          (rightVisible && rightArmAngle < 90 && this.isAngleInRange(rightShoulderAngle, -30, 30)))) {
        this.state = 'down';
        this.counter++;
        this.scene.events.emit(Constants.EVENT.COUNTER);
        console.log(this.counter + " PushUps");
      }
    }



    return false;
  }

  private areKeypointsValid(keypoints: NormalizedLandmark[]): boolean {
    return keypoints.every(point => point.visibility !== undefined && point.visibility >= PushUps.MIN_CONFIDENCE);
  }

  private isAngleInRange(angle: number, min: number, max: number): boolean {
    return angle >= min && angle <= max;
  }

  private isHorizontallyAligned(leftShoulder: NormalizedLandmark, rightShoulder: NormalizedLandmark, leftHip: NormalizedLandmark, rightHip: NormalizedLandmark): boolean {
    return Math.abs(leftShoulder.y - leftHip.y) < PushUps.HORIZONTAL_TOLERANCE && Math.abs(rightShoulder.y - rightHip.y) < PushUps.HORIZONTAL_TOLERANCE;
  }

  private clearTexts() {
    this.leftBotAngleText.setText('');
    this.leftTopAngleText.setText('');
    this.rightTopAngleText.setText('');
    this.rightBotAngleText.setText('');
  }

  private distanceCalculate(p1: any, p2: any): number {
    const dis = ((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) ** 0.5;
    return dis;
  }
}
