import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Marker from '~/gameobjects/marker';
import Phaser from 'phaser';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import Constants from '~/constants';
import { IArcadeExercise } from '~/workouts/arcade-exercice';

export default class AgilityWorkout implements IGymExercise, IArcadeExercise {
  markers: any[] = [];
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
  private exp: number = 0;
  private ball;
  private ballEmitter;
  private layoutFactory: ILayoutFactory;
  isReady: boolean = false;
  private particles;
  private ballAppearanceLeft: boolean = true;
  private ballAppearanceTop: boolean = true;
  private width: number = 1280;
  private height: number = 720;


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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


  createContactBall() {
    this.particles = this.scene.add.particles('particle-orange');
    this.ballEmitter = this.particles.createEmitter({
      speed: 80,
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: ['0xfff107']
    });

    this.ball = this.scene.physics.add.image(this.ballAppearanceLeft ? 0 : this.width, this.ballAppearanceTop ? 100 : this.height, 'meteorite');
    this.ball.setScale(0.15);
    this.ball.setAlpha(0.75);

    this.ballAppearanceLeft = !this.ballAppearanceLeft;
    if (Math.random() < 0.5) {
      this.ballAppearanceTop = !this.ballAppearanceTop;
    }

    this.ball.setVelocity(100, 200);
    this.ball.setBounce(1, 1);
    this.ball.setCollideWorldBounds(true);
    this.ball.setRotation(360);
    this.ballEmitter.startFollow(this.ball);
    this.bodyPoints.forEach((point) => {
      this.scene.physics.add.overlap(
        this.ball,
        point,
        (_) => {
          this.bodyContactBall();
        },
        undefined,
        this,
      );
    });
  }

  bodyContactBall() {
    this.exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    if (Number(this.scene.registry.get(Constants.REGISTER.EXP)) > 0) {
      this.exp = this.exp - 1;
    }
    this.ballEmitter.tint.onChange(0xff0000);
    this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.ballEmitter.tint.onChange(0xfff107);
      },
      loop: true
    })
    this.scene.registry.set(Constants.REGISTER.EXP, this.exp);
    this.scene.events.emit(Constants.EVENT.UPDATEEXP);
/*    if (!this.audioContactError.isPlaying) {
      this.audioContactError.play();
    }*/
  }

  destroyMarker(marker: any, touched: boolean): void {
    this.currentMarkersAlive--;
    this.exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    if (!touched) {
      if (Number(this.scene.registry.get(Constants.REGISTER.EXP)) > 0) {
        this.exp = this.exp - 10;
        if (!marker.getErrorMarker() && !touched) this.untouchedMarkers++;
      }
    } else if (touched) {
      this.exp = this.exp + 10;
      if (!marker.getErrorMarker() && touched) this.touchedMarkers++;
    }

    this.randomMarker = Math.floor(Math.random() * (24 - 1 + 1)) + 1;
    while (this.randomMarker === this.lastIdMarker) {
      this.randomMarker = Math.floor(Math.random() * (24 - 1 + 1)) + 1;
    }
    this.lastIdMarker = this.randomMarker;
    if (this.exp >= 100) {
      this.scene.time.addEvent({
        delay: 600, // ms
        callback: () => {
          this.ball.destroy();
          this.ballEmitter.manager.destroy();
          this.createContactBall();
        }
      });
    }

    this.scene.registry.set(Constants.REGISTER.EXP, this.exp);
    this.scene.events.emit(Constants.EVENT.UPDATEEXP);

    if (this.currentMarkersAlive == 0) {
      if (this.multipleMarkerProb) {
        this.maxMarkers = 2;
      } else {
        this.maxMarkers = 1;
      }
    }
  }

  update(poseResults: IPoseTrackerResults): boolean {
    this.markers.forEach((marker) => {
      if (marker.getAnimationCreated()) {
        marker.update();
      }

      if (marker.id == this.randomMarker) {
        if (!marker.getAnimationCreated() && this.triggerAction && this.currentMarkersAlive < this.maxMarkers) {
          marker.createAnimation();
          this.currentMarkersAlive++;
          this.randomMarker = Math.floor(Math.random() * (24 - 1 + 1)) + 1;
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

    this.ball.angle += 0.7;

    return false;
  }
}
