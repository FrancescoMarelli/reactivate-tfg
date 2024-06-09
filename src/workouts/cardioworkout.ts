import Phaser from 'phaser';
import Constants from '~/constants';
import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { IArcadeExercise } from '~/workouts/arcade-exercice';
import NewMarker from '~/gameobjects/new-marker';

export default class CardioWorkout implements IGymExercise, IArcadeExercise {
  markers: NewMarker[] = [];
  scene: Phaser.Scene;
  intensity: number;
  bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  isReady: boolean = false;

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


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getUntouchedMarkers(): number {
    return this.untouchedMarkers;
  }

  destroyMarker(marker: NewMarker, touched: boolean): void {
    this.currentMarkersAlive--;
    let exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    exp = this.updateExpAndUntouchedMarkers(marker, touched, exp);
    this.scene.registry.set(Constants.REGISTER.EXP, exp);
    this.scene.events.emit(Constants.EVENT.UPDATEEXP);
    this.updateRandomMarker();
    this.updateCurrentLevelAndMaxMarkers();
  }

  updateExpAndUntouchedMarkers(marker: NewMarker, touched: boolean, exp: number): number {
    if ((marker.getErrorMarker() && touched) || (!marker.getErrorMarker() && !touched)) {
      if (exp > 0) {
        exp -= 10;
        if (!marker.getErrorMarker() && !touched) {
          this.untouchedMarkers++;
        }
      }
      this.scene.events.emit(Constants.EVENT.UNTOUCHED);
    } else if ((marker.getErrorMarker() && !touched) || (!marker.getErrorMarker() && touched)) {
      exp += 10;
      if (!marker.getErrorMarker() && touched) {
        this.touchedMarkers++;
        this.scene.events.emit(Constants.EVENT.MARKER_COUNT);
      }
    }
    return exp;
  }

  updateRandomMarker(): void {
    this.randomMarker = Math.floor(Math.random() * 14) + 1;
    while (this.randomMarker === this.lastIdMarker) {
      this.randomMarker = Math.floor(Math.random() * 14) + 1;
    }
    this.lastIdMarker = this.randomMarker;
  }

  updateCurrentLevelAndMaxMarkers(): void {
    if (this.currentMarkersAlive === 0) {
      this.currentLevel = Number(this.scene.registry.get(Constants.REGISTER.LEVEL));
      this.probabilityTypesMarkers(0.15, this.currentLevel / 10);
      const baseMarkers = this.multipleMarkerProb ? (this.currentLevel > 5 ? 3 : 2) : 1;
      this.maxMarkers = Math.ceil(baseMarkers * (1 + (this.intensity - 1) * 0.5)); // Ajuste progresivo con la intensidad
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

  setMarkers(markers: NewMarker[]) {
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

    return false; // Return true to indicate that the workout is active
  }

  getTouchedMarkers(): number {
    return this.touchedMarkers;
  }

  getLevel(): number {
    return this.currentLevel;
  }

  setIntensity(intensity: number) {
    this.intensity = intensity;
  }
}
