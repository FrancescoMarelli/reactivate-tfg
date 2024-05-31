import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import { IArcadeExercise } from '~/workouts/arcade-exercice';

export default class CardioWorkout implements IGymExercise, IArcadeExercise {
  markers: Marker[] = [];
  scene: Phaser.Scene;

  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  private triggerAction: boolean = true;

  private multipleMarkerProb = false;
  private errorMakerProb = false;
  private currentMarkersAlive: number = 0;
  private maxMarkers: number = 1;
  private currentLevel: number = 1;

  private touchedMarkers: number = 0;
  private untouchedMarkers: number = 0;
  private totalTouchableMarkers: number = 0;
  private lastIdMarker = 0;
  private randomMarker: number = 3;

  private layoutFactory: ILayoutFactory;
  isReady: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  destroyMarker(marker: Marker, touched: boolean): void {
    this.currentMarkersAlive--;
    let exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    if ((marker.getErrorMarker() && touched) || (!marker.getErrorMarker() && !touched)) {
      if (exp > 0) {
        exp -= 10;
        if (!marker.getErrorMarker() && !touched) this.untouchedMarkers++;
      }
    } else if ((marker.getErrorMarker() && !touched) || (!marker.getErrorMarker() && touched)) {
      this.scene.events.emit(Constants.EVENT.COUNTER);
      exp += 10;
      if (!marker.getErrorMarker() && touched) this.touchedMarkers++;
    }
    this.scene.registry.set(Constants.REGISTER.EXP, exp);
    this.scene.events.emit(Constants.EVENT.UPDATEEXP);

    this.randomMarker = Math.floor(Math.random() * 14) + 1;
    while (this.randomMarker === this.lastIdMarker) {
      this.randomMarker = Math.floor(Math.random() * 14) + 1;
    }
    this.lastIdMarker = this.randomMarker;
    if (this.currentMarkersAlive === 0) {
      this.currentLevel = Number(this.scene.registry.get(Constants.REGISTER.LEVEL));
      this.probabilityTypesMarkers(0.15, this.currentLevel / 10);
      this.maxMarkers = this.multipleMarkerProb ? (this.currentLevel > 1 ? 4 : 3) : 2;
    }
  }

  probabilityTypesMarkers(probError: number, probMultiple: number) {
    const rand = Math.random();
    this.errorMakerProb = rand < probError;
    this.multipleMarkerProb = rand < probMultiple;
  }

  getCounter(): number {
    return this.touchedMarkers;
  }

  getType(): string {
    return 'Arcade';
  }

  setMarkers(markers: Marker[]) {
    this.markers = markers;
  }

  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]) {
    this.bodyPoints = bodyPoints;
  }

  update(poseResults: IPoseTrackerResults): boolean {
    this.markers.forEach((marker) => {
      if (marker.getAnimationCreated()) {
        marker.update();
      }

      if (marker.id === this.randomMarker) {
        if (!marker.getAnimationCreated() && this.triggerAction && this.currentMarkersAlive < this.maxMarkers) {
          marker.setErrorMarker(this.errorMakerProb);
          if (this.errorMakerProb) {
            this.errorMakerProb = false;
          }
          marker.createAnimation(this.currentLevel);
          this.currentMarkersAlive++;
          this.randomMarker = Math.floor(Math.random() * 14) + 1;
          this.totalTouchableMarkers++;
        }
      }
      if (marker.isInternalTimerConsumed() && marker.getAnimationCreated()) {
        marker.destroyMarkerAnimation(false);
        this.destroyMarker(marker, false);
      }
    });

    this.triggerAction = false;
    if (this.currentMarkersAlive === 0) {
      this.triggerAction = true;
    }

    return true; // Return true to indicate that the workout is active
  }
}
