import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import Phaser, { Scene } from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import CustomButtom from '~/gameobjects/custom-button';
import StatsData from '~/statsData';
import Utils from '~/utils';
import Menu from './menu';
import HUD from './hud';

export default class WorkoutCardio extends AbstractPoseTrackerScene {
  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  private markers: any[] = [];
  private triggerAction: boolean = true;
  private exp: number = 0;
  private levelTime: number;
  private remainingTime: number;
  private audioScene: Phaser.Sound.BaseSound;
  private workoutStarted: boolean = false;
  private silhouetteImage: Phaser.GameObjects.Image;
  private buttonsReady: any[] = [];
  private buttonReadyLeft;
  private buttonReadyRight;
  private getReadyLeft: boolean = false;
  private getReadyRight: boolean = false;
  private randomMarker: number = 3;
  private buttonExitMarker;
  private touchingButton: boolean = false;
  /* multipleMarker y errorMarker son asignadas cada vez que es necesario crear marcadores nuevos teniendo en cuenta la probabilidad en el nivel */
  private multipleMarkerProb = false;
  private errorMakerProb = false;
  private currentMarkersAlive: number = 0;
  private maxMarkers: number = 1; // Se empieza con al menos 1 marcador
  private currentLevel: number = 1;
  private width: number;
  private height: number;
  private touchedMarkers: number = 0;
  private untouchedMarkers: number = 0;
  private totalTouchableMarkers: number = 0;
  private lastIdMarker = 0;

  constructor() {
    super(Constants.SCENES.WorkoutCardio);
  }

  init() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
  }

  create(): void {
    super.create();

    /************** Buttons Init *********/
    this.buttonExitMarker = new CustomButtom(this, 1200, 52, 'out', '[➔', 95, -48);
    this.buttonExitMarker.setScale(0.9, 0.85);
    this.buttonsReady.push(this.buttonExitMarker);

    this.buttonReadyLeft = new CustomButtom(this, 340, 230, 'getReady', 'I', 95, -48);
    this.buttonReadyLeft.setScale(0.9, 0.85);
    this.buttonsReady.push(this.buttonReadyLeft);

    this.buttonReadyRight = new CustomButtom(this, 940, 230, 'getReady', 'D', 95, -48);
    this.buttonReadyRight.setScale(0.9, 0.85);
    this.buttonsReady.push(this.buttonReadyRight);

    this.buttonsReady.forEach((button) => {
      this.add.existing(button);
      this.physics.world.enable(button);
      button.body.setAllowGravity(false);
    });
    this.silhouetteImage = this.add.image(640, 420, 'silhouette');
    this.silhouetteImage.setScale(0.7, 0.65);
    // body points
    for (var i = 0; i < 24; i++) {
      let point = this.physics.add.sprite(-20, -20, 'point');
      this.add.existing(point);
      point.setAlpha(0);
      this.bodyPoints.push(point);
    }

    /*****************************************/

    this.audioScene = this.sound.add(Constants.AUDIO.TRANCE, { volume: 0.65, loop: false });

    /************** Get ready markers ******** */
    this.buttonsReady.forEach((button) => {

      this.bodyPoints.forEach((point) => {
        this.physics.add.overlap(
          button,
          point,
          () => {
            button.animateToFill(false);
            this.touchingButton = true;
            if (button.buttonIsFull() && button.isEnabled()) {
              button.emit('down', button);
            }
          },
          undefined,
          this,
        );
      });

      if (button) {
        button.setInteractive()
          .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
            button.animateToFill(true);
          })
          .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
            button.animateToEmpty(true);
          })
          .on('down', () => {
            button.animateToFill(true);
            this.touchingButton = true;
            if (button.buttonIsFull() && button.isEnabled()) {
              this.menuSwitch(button);
            }
          })
          .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
            button.animateToFill(true);
            this.touchingButton = true;
            if (button.buttonIsFull() && button.isEnabled()) {
              this.menuSwitch(button);
            }
          });
      }
    });
    /***************************************** */

    /************** Time control ************** */
    this.levelTime = 1;
    this.remainingTime = 8 * 60;
    this.registry.set(Constants.REGISTER.EXP, this.exp);
    /***************************************** */

    if (this.scene.get(Constants.SCENES.Menu))
      this.scene.remove(Constants.SCENES.Menu);
  }


  menuSwitch(button: CustomButtom) {
    switch (button.getText()) {
      case '[➔':
        this.stopScene();
        break;
      case 'I':
        this.getReadyLeft = true;
        break;
      case 'D':
        this.getReadyRight = true;
        break;
      default:
        break;
    }
    if (this.getReadyLeft && this.getReadyRight) {
      this.startWorkout();
      this.events.emit(Constants.EVENT.STOPAUDIOINIT);
    }
  }

  startWorkout() {
    this.createLayout();
    this.workoutStarted = true;
    this.silhouetteImage.destroy();
    this.buttonsReady.forEach((button) => {
      if (button.getText() != '[➔')
        button.destroy();
    });
    this.audioScene.play();
    this.getReadyLeft = false;
    this.getReadyRight = false;
    this.sound.pauseOnBlur = false;
  }

  movePoints(coords: IPoseLandmark[] | undefined) {
    if (this.bodyPoints && coords) {
      for (var i = 0; i < this.bodyPoints.length; i++) {
        if (i + 11 == 23){ // To extend hands points (improve accuracy)
          this.bodyPoints[i]?.setPosition(coords[19]?.x * 1280 + 20, coords[19]?.y * 720 - 40);
        }else if (i + 11 == 24){
          this.bodyPoints[i]?.setPosition(coords[20]?.x * 1280 - 20, coords[20]?.y * 720 - 40);
        }else{
          this.bodyPoints[i]?.setPosition(coords[i + 11]?.x * 1280, coords[i + 11]?.y * 720);
        }
      }
    }
  }

  createLayout(): void {
    let width: number = 225;
    let height: number = 150;
    let shortRow: boolean = true;
    let counterRow = 0;
    let triggerChangeRow: boolean = false;
    for (var i = 1; i < 15; i++) {
      const marker = new Marker({
        scene: this,
        x: width,
        y: height,
        texture: Constants.MARKER.ID,
        id: i,
      });
      counterRow++;
      if (shortRow) {
        if (counterRow == 2) {
          height = height + 125;
          width = 100;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          width = width + 830;
        }
      }
      if (!shortRow) {
        if (counterRow == 4) {
          height = height + 125;
          width = 225;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          if (i % 2 == 0) {
            width = width + 580;
          } else {
            width = width + 250;
          }
        }
      }
      if (triggerChangeRow) {
        shortRow = !shortRow;
        triggerChangeRow = false;
      }


      this.markers.push(marker);
      this.bodyPoints.forEach((point) => {
        this.physics.add.overlap(
          marker,
          point,
          (marker: any) => {
            if (marker.getAnimationCreated()) {
              marker.destroyMarkerAnimation(true);
              this.destroyMarker(marker, true);
            }
          },
          undefined,
          this,
        );
      });
    }



  }

  stopScene() {
    this.saveData();
    this.audioScene.stop();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }

  destroyMarker(marker: any, touched: boolean): void {
    this.currentMarkersAlive--;
    this.exp = Number(this.registry.get(Constants.REGISTER.EXP));
    if ((marker.getErrorMarker() && touched) || (!marker.getErrorMarker() && !touched)) {
      if (Number(this.registry.get(Constants.REGISTER.EXP)) > 0) {
        this.exp = this.exp - 10;
        if (!marker.getErrorMarker() && !touched) this.untouchedMarkers = this.untouchedMarkers + 1;
      }
    } else if ((marker.getErrorMarker() && !touched) || (!marker.getErrorMarker() && touched)) {
      this.exp = this.exp + 10;
      if (!marker.getErrorMarker() && touched) this.touchedMarkers = this.touchedMarkers + 1;
    }
    this.registry.set(Constants.REGISTER.EXP, this.exp);
    this.events.emit(Constants.EVENT.UPDATEEXP);

    // Update variables for next markers
    this.randomMarker = Math.floor(Math.random() * (14 - 1 + 1)) + 1;
    while (this.randomMarker === this.lastIdMarker) {
      this.randomMarker = Math.floor(Math.random() * (14 - 1 + 1)) + 1;
    }
    this.lastIdMarker = this.randomMarker;
    if (this.currentMarkersAlive === 0) {
      this.currentLevel = Number(this.registry.get(Constants.REGISTER.LEVEL))
      this.probabilityTypesMarkers(0.15, this.currentLevel / 10);
      if (this.multipleMarkerProb && this.currentLevel > 5) {
        this.maxMarkers = 3;
      } else if (this.multipleMarkerProb) {
        this.maxMarkers = 2;
      } else {
        this.maxMarkers = 1;
      }

    }
  }

  probabilityTypesMarkers(probError: number, probMultiple: number) {
    let rand = Math.random();
    rand < probError ? (this.errorMakerProb = true) : (this.errorMakerProb = false);
    rand < probMultiple ? (this.multipleMarkerProb = true) : (this.multipleMarkerProb = false);
  }

  saveData() {
    var date: string = Utils.getActualDate();
    var statsData = new StatsData("cardio", date, this.currentLevel, this.touchedMarkers, this.untouchedMarkers, this.totalTouchableMarkers);
    Utils.setLocalStorageData(statsData);
  }

  /* ***************************************************************************** */
  update(time: number, delta: number): void {
    if (!this.touchingButton) {
      this.buttonsReady.forEach((button) => {
        this.bodyPoints.forEach((point) => {
          if (point.body && point.body.touching.none) {
            button.animateToEmpty(false);
          }
        });
      });
    }
    this.touchingButton = false;
    super.update(time, delta, {
      renderElementsSettings: {
        shouldDrawFrame: true,
        shouldDrawPoseLandmarks: true,
      },
      beforePaint: (poseTrackerResults, canvasTexture) => {
        this.movePoints(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined);
      },
      afterPaint: (poseTrackerResults) => { },
    });
    /****************************************************************************** */
    if (this.workoutStarted) {
      this.markers.forEach((marker) => {
        if (marker.getAnimationCreated()) {
          // Si tiene animación actualizala.
          marker.update();
        }

        /* Lógica para crear los marcadores */
        if (marker.id == this.randomMarker) {
          if (!marker.getAnimationCreated() && this.triggerAction && this.currentMarkersAlive < this.maxMarkers) {
            marker.setErrorMarker(this.errorMakerProb);
            if (this.errorMakerProb) {
              this.errorMakerProb = false;
            }
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

      // Time Management
      if (this.levelTime != Math.floor(Math.abs(time / 1000))) {
        this.levelTime = Math.floor(Math.abs(time / 1000));
        this.remainingTime--;

        let minutes: number = Math.floor(this.remainingTime / 60);
        let seconds: number = Math.floor(this.remainingTime - minutes * 60);

        let clockText: string =
          Phaser.Utils.String.Pad(minutes, 2, '0', 1) + ':' + Phaser.Utils.String.Pad(seconds, 2, '0', 1);
        // Register
        this.registry.set(Constants.REGISTER.CLOCK, clockText);
        // Send to HUD
        this.events.emit(Constants.EVENT.CLOCK);

        // End of workout
        if (this.remainingTime == 0) {

          this.stopScene();
        }
      }
    }
  }
}
