import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';
import CustomButton from '~/gameobjects/custom-button';
import CustomButtom from '~/gameobjects/custom-button';
import StatsData from '~/statsData';
import Utils from '~/utils';
import Menu from './menu';
import { MovePoints } from '~/workouts/move-points';
import { PushUps } from '~/workouts/push-ups';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import { BackgroundSoundFactory } from '~/factories/sound/background-sound-factory';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';
import { IButtonFactory } from '~/factories/interfaces/button-factory.interface';
import { CustomButtonFactory } from '~/factories/buttons/custom-button-factory';
import { StandardSilhouetteFactory } from '~/factories/silhouette/silhouette-standard-factory';

export default class GameCreator extends AbstractPoseTrackerScene {
  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];

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

  private width: number;
  private height: number;

  // Configuración por json
  private config: any;
  private exp: number = 0;
  private levelTime: number;
  private remainingTime: number;
  private audioSettings;
  private markerTypes;
  private randomMarker: number = 3;
  private levelConfig;
  private movementSettings: any;
  private randomRange: any;
  private gymOpenAngleThreshold: number;
  private gymCloseAngleThresold: number;

  private counter: number = 0;
  private jumpCounterText: Phaser.GameObjects.Text;
  private detectorExercice;
  private jjBottom: any;
  private jjTop: any;
  private bot: number;
  private top: number;

  // Factories
  private soundFactory: ISoundFactory;
  private buttonFactory: IButtonFactory;
  private layoutFactory: ILayoutFactory;
  private movementFactory: IMovementFactory;
  private silhouetteFactory: ISilhouetteFactory;
  private markerFactory: IMarkerFactory;


  constructor() {
    super(Constants.SCENES.CONFIG);
    this.buttonFactory = new CustomButtonFactory();
    this.soundFactory = new BackgroundSoundFactory();
    this.silhouetteFactory = new StandardSilhouetteFactory();

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
      this.levelConfig = this.config.levelSettings[0];
      this.levelTime = this.levelConfig.levelTime; // Tiempo por nivel, asumiendo que quieres el tiempo por nivel
      this.remainingTime =  7*60 +7; // Tiempo restante predefinido

      this.randomMarker = this.levelConfig.randomMarker; // Acceder correctamente
      this.markerTypes = this.levelConfig.markerTypes;
      this.randomRange = this.levelConfig.randomRange;
      this.movementSettings = this.config.movementSettings;

      // Depends by exercies
      this.gymCloseAngleThresold = this.config.gymCloseThresold; // 40 - 30
      this.gymOpenAngleThreshold = this.config.gymOpenAngleThreshold; // 156
      this.jjBottom = this.config.jjBottom; // [[175, 180], 172]
      this.jjTop = this.config.jjTop; // [30, 40]
      this.bot = 40;

      this.audioSettings = this.config.audioSettings; // Configuraciones de audio son directas

      // detection
      this.detectorExercice = new PushUps(this);  // Pass the current scene to the JumpinJackDetector
      this.counter = 0;
      this.events.on(Constants.EVENT.COUNTER, this.updateJumpCounter, this);

      /***************************************** */

      if (this.scene.get(Constants.SCENES.Menu))
        this.scene.remove(Constants.SCENES.Menu);
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.scene.stop();
    }
    this.setupScene();
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

    this.buttonsReady.forEach((button) => {
      this.add.existing(button);
      this.physics.world.enable(button);
      button.body.setAllowGravity(false);
    });

    this.silhouetteImage = this.silhouetteFactory.create(this, 640, 360, 'silhouette');
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


  stopScene() {
    this.saveData();
    this.audioScene.stop();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }

  saveData() {
    var date: string = Utils.getActualDate();
    var statsData = new StatsData("game-creator", date, this.currentLevel, this.touchedMarkers, this.untouchedMarkers, this.totalTouchableMarkers);
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
          if (this.detectorExercice.update(poseTrackerResults)) {
            this.counter++;
            this.registry.set(Constants.REGISTER.COUNTER, this.counter);
            this.events.emit(Constants.EVENT.UPDATEEXP, this.counter);

          }
        }
        },
      afterPaint: (poseTrackerResults) => {

      },
    });

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
        if (this.remainingTime == 0) {
          this.stopScene();
        }
      }
    }
  }


  updateJumpCounter() {
    this.counter++;
    this.exp = this.counter; // Incrementa la experiencia en base al contador de saltos
    this.registry.set(Constants.REGISTER.EXP, this.exp); // Actualiza el registro de la experiencia
    this.events.emit(Constants.EVENT.UPDATEEXP); // Emite el evento de actualización de la experiencia
  }
}
