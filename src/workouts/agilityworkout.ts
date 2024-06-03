import { IGymExercise } from '~/workouts/gym-exercise.interface';
import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import Marker from '~/gameobjects/marker';
import Phaser from 'phaser';
import Constants from '~/constants';
import { IArcadeExercise } from '~/workouts/arcade-exercice';

export default class AgilityWorkout implements IGymExercise, IArcadeExercise {
  markers: any[] = [];
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
  private exp: number = 0;
  private ball;
  private ballEmitter;
  private particles;
  private ballAppearanceLeft: boolean = true;
  private ballAppearanceTop: boolean = true;
  private width: number = 1280;
  private height: number = 720;
  private theme : string;
  private scale: number;


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getCounter(): number {
    return this.touchedMarkers;
  }

  getType(): string {
    return 'Arcade';
  }

  getTheme(): string {
    return this.theme;
  }

  setTheme(theme: string): void {
    this.theme = theme;
  }

  setMarkers(markers: Marker[]) {
    this.markers = markers;
  }

  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]) {
    this.bodyPoints = bodyPoints;
  }

  switchTheme(theme: string): string {
    switch (theme) {
      case 'default':
        this.scale = 0.12;
        return 'meteorite';
        break;
      case 'japan':
        this.scale = 0.07;
        return 'redAnime';
        break;
      case 'medieval':
        this.scale = 0.07;
        return 'medievalRed';
        break;
      case 'future':
        this.scale = 0.07;
        return 'redFuture';
        break;
      default:
        this.scale = 0.12;
        return 'meteorite';
        break;

    }
  }


  createContactBall() {
    this.particles = this.scene.add.particles('particle-orange');
    this.ballEmitter = this.particles.createEmitter({
      speed: 80 * this.intensity,
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      tint: ['0xfff107']
    });

    let spriteKey = this.switchTheme(this.theme);

    this.ball = this.scene.physics.add.image(this.ballAppearanceLeft ? 0 : this.width, this.ballAppearanceTop ? 100 : this.height, spriteKey);
    this.ball.setScale(this.scale);
    this.ball.setAlpha(0.75);

    this.ballAppearanceLeft = !this.ballAppearanceLeft;
    if (Math.random() < 0.5) {
      this.ballAppearanceTop = !this.ballAppearanceTop;
    }

    this.ball.setVelocity(100 * this.intensity, 200 * this.intensity);
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

  getUntouchedMarkers(): number {
    return this.untouchedMarkers;
  }


  destroyMarker(marker: any, touched: boolean): void {
    this.currentMarkersAlive--;
    this.exp = Number(this.scene.registry.get(Constants.REGISTER.EXP));
    if (!touched) {
      if (Number(this.scene.registry.get(Constants.REGISTER.EXP)) > 0) {
        this.exp = this.exp - 10;
        if (!marker.getErrorMarker() && !touched) {
          this.untouchedMarkers++;
        }
      }
      this.scene.events.emit(Constants.EVENT.UNTOUCHED); // Emite el evento solo si el marcador fue tocado
    } else if (touched) {
      this.exp = this.exp + 10;
      if (!marker.getErrorMarker() && touched) {
        this.touchedMarkers++;
        this.scene.events.emit(Constants.EVENT.MARKER_COUNT); // Emite el evento solo si el marcador fue tocado
      }
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
          this.currentLevel = Number(this.scene.registry.get(Constants.REGISTER.LEVEL))
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
