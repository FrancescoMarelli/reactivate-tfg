import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButtom from '~/gameobjects/custom-button';
import StatsData from '~/statsData';
import Utils from '~/utils';
import Menu from './menu';
import { MovePoints } from '~/workouts/move-points';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { BackgroundSoundFactory } from '~/factories/sound/background-sound-factory';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';
import { IButtonFactory } from '~/factories/interfaces/button-factory.interface';
import { CustomButtonFactory } from '~/factories/buttons/custom-button-factory';
import { StandardSilhouetteFactory } from '~/factories/silhouette/silhouette-standard-factory';
import { PushUpsFactory } from '~/factories/workouts/push-ups-factory';
import { WeightLiftinFactory } from '~/factories/workouts/weight-liftin-factory';
import { JumpingJackFactory } from '~/factories/workouts/jumping-jack-factory';
import { CardioFactory } from '~/factories/workouts/cardio-factory';
import { StaticLayoutFactory } from '~/factories/layout/static-layout-factory';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import Marker from '~/gameobjects/marker';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';


export default class GameCreator extends AbstractPoseTrackerScene {
  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  private markers: Marker[] = [];

  private audioScene: Phaser.Sound.BaseSound;
  private silhouetteImage: Phaser.GameObjects.Image;

  // Buttons
  private buttonsReady: any[] = [];
  private buttonReadyLeft;
  private buttonReadyRight;
  private buttonExitMarker;

  private workoutStarted: boolean = false;
  private getReadyLeft: boolean = false;
  private getReadyRight: boolean = false;
  private touchingButton: boolean = false;

  // Markers

  private currentLevel: number = 1;
  private touchedMarkers: number = 0;
  private untouchedMarkers: number = 0;
  private totalTouchableMarkers: number = 0;
  private lastIdMarker = 0;
  private currentMarkersAlive: number = 0;

  private width: number;
  private height: number;

  // Configuración por json
  private config: any;
  private workoutConfig: any;

  private type : string;
  private exp: number = 0;
  private levelTime: number;
  private remainingTime: number;
  private audioSettings;
  private markerTypes;
  private randomMarker: number = 3;
  private levelConfig;
  private movementSettings: any;
  private randomRange = 14;

  private counter: number = 0;
  private counterText: Phaser.GameObjects.Text;
  private detectorExercice;



  // Factories
  private soundFactory: ISoundFactory;
  private buttonFactory: IButtonFactory;
  private movementFactory: IMovementFactory | AbstractPoseTrackerScene;
  private silhouetteFactory: ISilhouetteFactory;
  private layoutFactory : ILayoutFactory;
  private buttonShowLandmarks: Phaser.GameObjects.Container;
  private intensity: any;
  private difficulty: any;


  constructor() { // creo que las fabricas deberias de pasarse por parametro
    super(Constants.SCENES.GAME_CREATOR);
    this.silhouetteFactory = new StandardSilhouetteFactory();
    this.buttonFactory = new CustomButtonFactory();
    this.soundFactory = new BackgroundSoundFactory();
    this.layoutFactory = new StaticLayoutFactory();
  }

  init() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
  }

  async create() {
    super.create();
    try {
      //json param reading
      this.config = await this.loadJsonConfig();



      /***/
      const gameConfig  = this.registry.get('game-config');
      this.type = gameConfig.type;
      this.audioSettings = gameConfig.backgroundMusic;
      this.markerTypes = gameConfig.markerTypes;
      this.intensity = gameConfig.intensity;
      this.difficulty = gameConfig.difficulty;
      this.workoutConfig = gameConfig.workoutConfig;
      console.log('Game Config:', gameConfig);
      this.levelTime = 0.3;
      this.remainingTime = this.workoutConfig.time + 7;

      this.randomMarker = 3;

      this.movementSettings = this.config.movementSettings;


      this.counter = 0;
      this.events.on(Constants.EVENT.COUNTER, this.updateCounter, this);

      /***************************************** */

      if (this.scene.get(Constants.SCENES.CONFIG))
        this.scene.remove(Constants.SCENES.CONFIG);

    } catch (error) {
      console.error('Error loading configuration:', error);
      this.scene.stop();
    }

    this.setupScene();

    this.workoutSwitch(this.type);
    this.detectorExercice = this.movementFactory.create(this, { top: null, bot: null });
  }

  workoutSwitch(workout: string) {
    switch (workout) {
      case 'push-ups':
        this.movementFactory = new PushUpsFactory();
        break;
      case 'weight-lifting':
        this.movementFactory = new WeightLiftinFactory();
        break;
      case 'jumping-jacks':
        this.movementFactory = new JumpingJackFactory();
        break;
      case 'cardio':
        this.movementFactory = new CardioFactory();
        break;

    }
  }

  async loadJsonConfig() {
    const jsonPath = 'game-config.json';
    return new Promise((resolve, reject) => {
      this.load.json('gameConfig', jsonPath);
      this.load.once('complete', () => {
        const config = this.cache.json.get('gameConfig');
        resolve(config);
      });
      this.load.once('loaderror', () => {
        reject(new Error('Failed to load JSON'));
      });
      this.load.start();
    });
  }

  setupScene() {
    this.audioScene = this.soundFactory.create(this, this.config.audioSettings);
    this.createButtons();
  }

  createButtons() {
    // Button creation logic here
    this.buttonExitMarker = this.buttonFactory.create(this, 1200, 52, 'out', '[➔', 95, -48);
    this.buttonsReady.push(this.buttonExitMarker);

    this.buttonReadyLeft = this.buttonFactory.create(this, 340, 230, 'getReady', 'I', 95, -48);
    this.buttonsReady.push(this.buttonReadyLeft);

    this.buttonReadyRight = this.buttonFactory.create(this, 940, 230, 'getReady', 'D', 95, -48);
    this.buttonsReady.push(this.buttonReadyRight);

    let text =
    this.buttonShowLandmarks = this.buttonFactory.create(this, 1200 - 170, 52, 'out', 'Show', 95, -48);
    this.buttonsReady.push(this.buttonShowLandmarks);

    this.buttonsReady.forEach((button) => {
      this.add.existing(button);
      this.physics.world.enable(button);
      button.body.setAllowGravity(false);
    });

    // silhoutte creation
    this.silhouetteImage = this.silhouetteFactory.create(this, 640, 420, 'silhouette');
    // Body points creation logic /  detection here
    for (let i = 0; i < 24; i++) {
      let point = this.physics.add.sprite(-20, -20, 'point');
      this.add.existing(point);
      point.setAlpha(0);
      this.bodyPoints.push(point);
    }

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
    // Comprobar si es necesario
  }

  toggleLandmarks() {
    MediapipePoseDetector.showLandmarks = !MediapipePoseDetector.showLandmarks;
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
      case 'Show':
        this.toggleLandmarks();
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

    this.workoutStarted = true;
    this.silhouetteImage.destroy();
    if(this.detectorExercice.getType() == 'Arcade') {
      this.markers = this.layoutFactory.create(this, this.bodyPoints);
      this.detectorExercice.setBodyPoints(this.bodyPoints);
      this.detectorExercice.setMarkers(this.markers);
    }

    this.buttonsReady.forEach((button) => {
      if (button.getText() != '[➔' && button.getText() != 'Show')
        button.destroy();
    });
    this.audioScene.play();
    this.getReadyLeft = false;
    this.getReadyRight = false;
    this.sound.pauseOnBlur = false;
  }


  stopScene() {
    this.saveData();
    this.audioScene.stop();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }

  saveData() {
    let date: string = Utils.getActualDate();
    let statsData = new StatsData("game-creator", date, this.currentLevel, this.touchedMarkers, this.untouchedMarkers, this.totalTouchableMarkers);
    Utils.setLocalStorageData(statsData);
  }

  /* ***************************************************************************** */
  update(time: number, delta: number): void {
    super.update(time, delta, {
      renderElementsSettings: {
        shouldDrawFrame: true,
        shouldDrawPoseLandmarks: true,
      },
      beforePaint: (poseTrackerResults, canvasTexture) => {
        MovePoints.movePoints(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined, this.bodyPoints, this.movementSettings);
        if(this.workoutStarted ) {
          this.detectorExercice.isReady = true;
          if (this.detectorExercice.update(poseTrackerResults) && this.detectorExercice.getType() != 'Arcade') {
            this.updateCounter();
            this.registry.set(Constants.REGISTER.COUNTER, this.counter);
            this.events.emit(Constants.EVENT.UPDATEEXP, this.counter);

          }
        }
        },
        afterPaint: (poseTrackerResults) => {

        },
      });

  /****************************************************************************** */
    /****************************************************************************** */
    if (this.workoutStarted) {
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
          if (this.remainingTime == 0 || this.counter >= this.workoutConfig.reps) {
            let message;
            if (this.counter >= this.workoutConfig.reps) {
              message = '¡Juego finalizado,\nobjetivo logrado!';
            } else {
              message = '¡Juego finalizado,\nno has podido con el workout!';
            }
            let text = this.add.text(600, 300, message, {
              fontSize: '52px',
              color: '#fff',
              fontFamily: 'Roboto',
              fontStyle: 'bold'
            });
            text.setOrigin(0.5, 0.5);
            setTimeout(() => {
              this.stopScene();
            }, 3000);
          }
        }
    }
  }


  updateCounter() {
    this.counter++;
    this.exp = this.counter;
    this.registry.set(Constants.REGISTER.EXP, this.exp); // Actualiza el registro de la experiencia
    this.events.emit(Constants.EVENT.UPDATEEXP); // Emite el evento de actualización de la experiencia
  }
}
