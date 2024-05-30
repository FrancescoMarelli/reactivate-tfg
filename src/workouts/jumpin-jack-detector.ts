import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import Phaser from 'phaser';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';

export class JumpinJackDetector implements IGymExercise {

  private scene: Phaser.Scene;  // Add a scene property
  private state: 'grounded' | 'ascending' | 'inAir' | 'descending';
  private botMinRange : [number, number];
  private botMax : number;
  private topMinAngle: number;
  private topMaxAngle : number;
  private jumpCounter = 0;
  private isReady: boolean;

  private leftLegAngleText: Phaser.GameObjects.Text;
  private rightLegAngleText: Phaser.GameObjects.Text;
  private leftArmAngleText: Phaser.GameObjects.Text;
  private rightArmAngleText: Phaser.GameObjects.Text;


  constructor(scene: Phaser.Scene) {  // Add a scene parameter to the constructor
    this.scene = scene;
    this.state = 'grounded';
    this.isReady = false;
    this.topMinAngle = 20;
    this.topMaxAngle = 160;
    this.botMinRange = [175, 180];
    this.botMax = 172;

    this.leftLegAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });
    this.rightLegAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });
    this.leftArmAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });
    this.rightArmAngleText = this.scene.add.text(0, 0, '', { color: 'red', fontStyle:'bold', fontSize: '40px' });

  }

  getCounter() {
    return this.jumpCounter;
  }

  update(poseResults: IPoseTrackerResults): boolean {
    if(!this.isReady) {
      return false;
    }

    const landmarks = poseResults.poseLandmarks;

    if(!landmarks) return false;


    // Existing jumping jack detection logic
    const leftShoulder = landmarks?.[EPoseLandmark.RightShoulder];
    const leftHip = landmarks?.[EPoseLandmark.RightHip];
    const leftWrist = landmarks?.[EPoseLandmark.RightWrist];
    const leftKnee = landmarks?.[EPoseLandmark.RightKnee]

    const rightShoulder = landmarks?.[EPoseLandmark.LeftShoulder];
    const rightHip = landmarks?.[EPoseLandmark.LeftHip];
    const rightKnee = landmarks?.[EPoseLandmark.LeftKnee];
    const rightWrist = landmarks?.[EPoseLandmark.LeftWrist];

    const leftLegPixel = {x: leftHip.x * this.scene.scale.width, y : leftHip.y * this.scene.scale.height};
    const rightLegPixel = { x: rightHip.x * this.scene.scale.width, y : rightHip.y * this.scene.scale.height};
    const leftArmPixel = {x: leftShoulder.x * this.scene.scale.width, y : leftShoulder.y * this.scene.scale.height};
    const rightArmPixel = { x: rightShoulder.x * this.scene.scale.width, y : rightShoulder.y * this.scene.scale.height};

    // Check if coordinates exist before calculating angles
    if (leftShoulder && leftHip && leftWrist && rightShoulder && rightHip  && rightWrist && leftKnee && rightKnee
    && leftShoulder.visibility > 0.5 && leftHip.visibility > 0.5 && leftWrist.visibility > 0.5 &&
      rightShoulder.visibility > 0.5 && rightHip.visibility > 0.5 && rightWrist.visibility > 0.5 && leftKnee.visibility > 0.5 && rightKnee.visibility > 0.5) {

      const angleLeftArm = AnglesUtils.calculateAngle(leftHip, leftShoulder, leftWrist);
      const angleRightArm = AnglesUtils.calculateAngle(rightHip, rightShoulder, rightWrist);
      const angleLeftLeg = AnglesUtils.calculateAngle(leftShoulder,leftHip, leftKnee);
      const angleRightLeg = AnglesUtils.calculateAngle(rightShoulder, rightHip, rightKnee);

      if (MediapipePoseDetector.showLandmarks) {
        this.leftLegAngleText.setText(` ${angleLeftLeg?.toFixed(0)}`);
        this.leftLegAngleText.setPosition(leftLegPixel.x, leftLegPixel.y);
        this.rightLegAngleText.setText(`${angleRightLeg?.toFixed(0)}`);
        this.rightLegAngleText.setPosition(rightLegPixel.x, rightLegPixel.y);
        this.leftArmAngleText.setText(` ${angleLeftArm?.toFixed(0)}`);
        this.leftArmAngleText.setPosition(leftArmPixel.x, leftArmPixel.y);
        this.rightArmAngleText.setText(`${angleRightArm?.toFixed(0)}`);
        this.rightArmAngleText.setPosition(rightArmPixel.x, rightArmPixel.y);
      } else {
        this.leftLegAngleText.setText('');
        this.rightLegAngleText.setText('');
        this.leftArmAngleText.setText('');
        this.rightArmAngleText.setText('');
      }
      if (angleLeftArm <= this.topMinAngle && angleRightArm <= this.topMinAngle  && angleLeftLeg >= this.botMinRange[0] && angleLeftLeg <= this.botMinRange[1]
                                                                                  && angleRightLeg >= this.botMinRange[0] && angleRightLeg <= this.botMinRange[1]) {
        this.state = 'inAir';
        this.scene.events.emit(Constants.EVENT.UPDATE_HALF);
      }
      if (angleLeftArm >= this.topMaxAngle && angleRightArm >= this.topMaxAngle && angleLeftLeg <= this.botMax && angleRightLeg <= this.botMax  && this.state == 'inAir') {
        this.state = 'grounded';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.scene.events.emit(Constants.EVENT.FULL)
        this.jumpCounter++;
        return true;  // Jumping jack ends when returning to up state
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



