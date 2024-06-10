import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Phaser from 'phaser';
import Constants from '~/constants';
import Utils from '~/utils';
import { IArcadeExercise } from '~/workouts/arcade-exercice';
import NewMarker from '~/gameobjects/new-marker';

const sVi = [2, 8, 14, 20]; // Izquierda vertical
const sVd = [5, 11, 17, 23]; // Derecha vertical
const s1 = [3, 8, 14, 21];
const s2 = [4, 11, 17, 22];
const sHi = [7, 8, 9];
const sHd = [10, 11, 12];
const sequences = [sVi, sVd, s1, s2, sHi, sHd];

export default class FlexibilityWorkout implements IGymExercise, IArcadeExercise {
  isReady: boolean;
  scene: Phaser.Scene;
  intensity: number;
  bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  markers: any[] = [];


  private triggerAction: boolean = true;
  private exp: number = 0;
  private silhouetteImage: Phaser.GameObjects.Image;

  private randomSequence: number = 3;
  private buttonExitMarker;
  /* multipleMarker y errorMarker son asignadas cada vez que es necesario crear marcadores nuevos teniendo en cuenta la probabilidad en el nivel */
  private nextSequence: number = 1;
  private invertDirection = false;
  private currentMarkersAlive: number = 0;
  private maxMarkers: number = sequences[3].length; // Se empieza con al menos 1 secuencia
  private currentLevel: number = 1;
  private width: number = 1280;
  private height: number = 720;
  private touchedMarkers: number = 0;
  private untouchedMarkers: number = 0;
  private totalTouchableMarkers: number = 0;
  private nextSequenceDirectionCopy: number[] = [];
  private controlNextMarker: number = 0;
  private prevMarker;
  private showNextSequence: boolean = true;
  private lastIdSequence = 0;


  constructor(scene : Phaser.Scene) {
    this.scene = scene;
  }

  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]): void {
    this.bodyPoints = bodyPoints;
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

  update(poseResults: IPoseTrackerResults): boolean {
    this.markers.forEach((marker) => {
      if (marker.getAnimationCreated()) {
        // Si tiene animación actualizala.
        marker.update();
      }
      /* Lógica para crear los marcadores */
      if (sequences[this.randomSequence].includes(marker.id) && this.showNextSequence) {
        if (!marker.getAnimationCreated() && this.triggerAction && this.currentMarkersAlive < this.maxMarkers) {
          this.nextSequenceDirectionCopy = Array.from(sequences[this.randomSequence]);
          var rotation = 1.57;
          var horizontalSequence = sequences[this.randomSequence].length == 3 ? true : false;
          if (!this.invertDirection && marker.id != this.nextSequenceDirectionCopy[0]) {
            marker.setErrorMarker(true);
          } else if (this.invertDirection && marker.id != this.nextSequenceDirectionCopy[this.nextSequenceDirectionCopy.length - 1]) {
            marker.setErrorMarker(true);
          }
          else {
            marker.setErrorMarker(false);
            this.controlNextMarker = 1;
          }
          // Set rotation in vertical sequences
          if (!horizontalSequence) {
            if (!this.invertDirection) {
              rotation += 3.141;
            }
            if (marker.id != this.nextSequenceDirectionCopy[this.nextSequenceDirectionCopy.length - 1]) {
              rotation += Phaser.Math.Angle.Between(this.markers.find((marker) => marker.id === this.nextSequenceDirectionCopy[this.controlNextMarker]).x, this.markers.find((marker) => marker.id === this.nextSequenceDirectionCopy[this.controlNextMarker]).y, marker.x, marker.y);
            } else {
              rotation += Phaser.Math.Angle.Between(marker.x, marker.y, this.prevMarker.x, this.prevMarker.y);
            }
          }
          // Set rotation in invert direction sequences
          if (!this.invertDirection && horizontalSequence) {
            rotation = 1.57;
          } else if (this.invertDirection && horizontalSequence) {
            rotation = -1.57;
          }
          marker.setDirectionAngle(rotation);
          this.prevMarker = marker;
          marker.createAnimation(this.currentLevel, this.intensity);
          if (this.controlNextMarker < this.nextSequenceDirectionCopy.length - 1) {
            this.controlNextMarker = this.controlNextMarker + 1;
          }
          this.currentMarkersAlive++;
          this.totalTouchableMarkers++;
        }
      }
      if (marker.isInternalTimerConsumed() && marker.getAnimationCreated()) {
        marker.destroyMarkerAnimation(false);
        this.destroyMarker(marker, false);
      }
    });

    this.triggerAction = false;
    if (this.currentMarkersAlive == 0) {
      this.triggerAction = true;
    }
    return false;
  }

  getUntouchedMarkers(): number {
    return this.untouchedMarkers;
  }

  getTouchedMarkers(): number {
    return this.touchedMarkers;
  }

  destroyMarker(marker: any, touched: boolean): void {
    this.currentMarkersAlive--;
    this.showNextSequence = false;
    this.exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    if ((marker.getErrorMarker() && touched) || (!marker.getErrorMarker() && !touched)) {
      if (Number(this.scene.registry.get(Constants.REGISTER.EXP)) > 0) {
        this.exp = this.exp - 10;
        if (!marker.getErrorMarker() && !touched) {
          this.untouchedMarkers = this.untouchedMarkers + 1;
        }
      }
      this.scene.events.emit(Constants.EVENT.UNTOUCHED); // Emite el evento solo si el marcador fue tocado
      this.nextSequenceDirectionCopy = this.nextSequenceDirectionCopy.filter(id => id !== marker.id)
    } else if (!marker.getErrorMarker() && touched) {
      this.exp = this.exp + 10;
      this.invertDirection ? this.nextSequenceDirectionCopy.pop() : this.nextSequenceDirectionCopy.shift();
      if (this.nextSequenceDirectionCopy.length > 0) {
        this.markers.forEach(marker => {
          var nextMarker = this.invertDirection ? this.nextSequenceDirectionCopy[this.nextSequenceDirectionCopy.length - 1] : this.nextSequenceDirectionCopy[0];
          if (marker.id === nextMarker) {
            marker.setErrorMarker(false);
          }
        })
      }
      if (!marker.getErrorMarker() && touched) {
        this.touchedMarkers = this.touchedMarkers + 1;
        this.scene.events.emit(Constants.EVENT.MARKER_COUNT); // Emite el evento solo si el marcador fue tocado
      }
    }
    this.scene.registry.set(Constants.REGISTER.EXP, this.exp);
    this.scene.events.emit(Constants.EVENT.UPDATEEXP);
    // Update variables for next markers
    if (this.currentMarkersAlive == 0) {
      this.scene.time.addEvent({
        delay: 1500,                // ms
        callback: () => {
          this.controlNextMarker = 1;
          this.currentLevel = Number(this.scene.registry.get(Constants.REGISTER.LEVEL))
          this.probabilityTypesMarkers(0.5);
          this.randomSequence = Utils.random(0, sequences.length - 1);
          while (this.randomSequence === this.lastIdSequence) {
            this.randomSequence = Utils.random(0, sequences.length - 1);
          }
          this.lastIdSequence = this.randomSequence;
          this.maxMarkers = sequences[this.randomSequence].length;
          this.showNextSequence = true;
        },
      });
    }
  }

  probabilityTypesMarkers(probInv: number) {
    probInv *= this.intensity;
    let rand = Math.random();
    rand < probInv ? (this.invertDirection = true) : (this.invertDirection = false);
    this.nextSequence = Utils.random(0, sequences.length - 1);
  }

  getLevel(): number {
    return this.currentLevel;
  }

  setIntensity(intensity: number) {
    this.intensity = intensity;
  }
}
