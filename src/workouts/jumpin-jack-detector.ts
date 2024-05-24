import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import { AnglesUtils } from '~/workouts/angles-utils';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import Phaser from 'phaser';

export class JumpinJackDetector implements IGymExercise {

  private scene: Phaser.Scene;  // Add a scene property
  private state: 'grounded' | 'ascending' | 'inAir' | 'descending';
  private botMinRange : [number, number];
  private botMax : number;
  private topMinAngle: number;
  private topMaxAngle : number;
  private jumpCounter = 0;
  private isReady: boolean;


  constructor(scene: Phaser.Scene, bottomAngle: number, topAngle: number) {  // Add a scene parameter to the constructor
    this.scene = scene;
    this.state = 'grounded';
    this.isReady = false;
    // Validate top angles
    if (Array.isArray(topAngle) && topAngle[0] < topAngle[1]) {
      this.topMinAngle = topAngle[0];
      this.topMaxAngle = topAngle[1];
    } else {
      this.topMinAngle = 30;
      this.topMaxAngle = 140;
    }

    // Validate bottom angles
    if (Array.isArray(bottomAngle) && bottomAngle[0] < bottomAngle[1]) {
      this.botMinRange = bottomAngle[0];
      this.botMax = bottomAngle[1];
    } else {
      this.botMinRange = [175, 180];
      this.botMax = 172;
    }
  }

  getCounter() {
    return this.jumpCounter;
  }

  update(poseResults: IPoseTrackerResults): boolean {
    if(!this.isReady) {
      return false;
    }

    const landmarks = poseResults.poseLandmarks;

    // Existing jumping jack detection logic
    const leftShoulder = landmarks?.[EPoseLandmark.RightShoulder];
    const leftHip = landmarks?.[EPoseLandmark.RightHip];
    const leftWrist = landmarks?.[EPoseLandmark.RightWrist];
    const leftKnee = landmarks?.[EPoseLandmark.RightKnee]
    const leftAnkle = landmarks?.[EPoseLandmark.RightAnkle];

    const rightShoulder = landmarks?.[EPoseLandmark.LeftShoulder];
    const rightHip = landmarks?.[EPoseLandmark.LeftHip];
    const rightKnee = landmarks?.[EPoseLandmark.LeftKnee];
    const rightWrist = landmarks?.[EPoseLandmark.LeftWrist];
    const rightAnkle = landmarks?.[EPoseLandmark.LeftAnkle];

    // Check if coordinates exist before calculating angles
    if (leftShoulder && leftHip && leftWrist && rightShoulder && rightHip  && rightWrist && leftKnee && rightKnee) {
      const angleLeftArm = AnglesUtils.calculateAngle(leftHip, leftShoulder, leftWrist);
      const angleRightArm = AnglesUtils.calculateAngle(rightHip, rightShoulder, rightWrist);
      const angleLeftLeg = AnglesUtils.calculateAngle(leftShoulder,leftHip, leftKnee);
      const angleRightLeg = AnglesUtils.calculateAngle(rightShoulder, rightHip, rightKnee);

      //console.log("Left Bot Angle: " + angleLeftLeg + " ----------------- Right Bot Angle: " + angleRightLeg);

      // Jumping jack detection logic --- nivel de dificultad  1-2-3 angulos de brazos y piernas
      if (angleLeftArm <= this.topMinAngle && angleRightArm <= this.topMinAngle  && angleLeftLeg >= this.botMinRange[0] && angleLeftLeg <= this.botMinRange[1]
                                                                                  && angleRightLeg >= this.botMinRange[0] && angleRightLeg <= this.botMinRange[1]) {
        this.state = 'inAir';
      }
      if (angleLeftArm >= this.topMaxAngle && angleRightArm >= this.topMaxAngle && angleLeftLeg <= this.botMax && angleRightLeg <= this.botMax  && this.state == 'inAir') {
        this.state = 'grounded';
        this.scene.events.emit(Constants.EVENT.COUNTER);  // Emit the event using the scene property
        this.jumpCounter++;
        console.log(this.jumpCounter + " JUMPS");  // Add this line
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



