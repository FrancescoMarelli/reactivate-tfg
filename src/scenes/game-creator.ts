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
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import Marker from '~/gameobjects/marker';
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';
import { ArcadeFactory } from '~/factories/interfaces/ArcadeFactory';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { AgilidadFactory } from '~/factories/workouts/agilidad-factory';
import { FlexibilidadFactory } from '~/factories/workouts/flexibilidad-factory';
import { StaticLayoutFactory } from '~/factories/layout/static-layout-factory';
import { AgilityLayoutFactory } from '~/factories/layout/agility-layout-factory';
import { FlexibilityLayoutFactory } from '~/factories/layout/flexibility-layout-factory';


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
  private workoutConfig: any;

  private type : string;
  private exp: number = 0;
  private levelTime: number;
  private remainingTime: number;
  private audioSettings;
  private markerTypes;
  private randomMarker: number = 3;
  private movementSettings: any;

  private counter: number = 0;
  private counterText: Phaser.GameObjects.Text;
  private detectorExercise;
  private workoutEnded: boolean = false;


  // Factories
  private soundFactory: ISoundFactory;
  private buttonFactory: IButtonFactory;
  private movementFactory: IMovementFactory | ArcadeFactory;
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
  }

  init() {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
  }

   create() {
    super.create();
    try {

      const gameConfig  = this.registry.get('game-config');
      this.type = gameConfig.type;
      this.audioSettings = gameConfig.backgroundMusic;
      this.markerTypes = gameConfig.markerTypes;
      this.intensity = gameConfig.intensity;
      this.difficulty = gameConfig.difficulty;
      this.workoutConfig = gameConfig.workoutConfig;
      this.levelTime = 0.3;
      this.remainingTime = this.workoutConfig.time  + 60;
      this.randomMarker = 3;
      this.movementSettings = {
        activeJoints: ["LeftIndex", "RightIndex"]
      } ;
      this.counter = 0;

      this.registry.set(Constants.REGISTER.EXP, this.exp);
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
    this.detectorExercise = this.movementFactory.create(this);


  }

  getType(): string {
    return this.type;
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
        this.layoutFactory = new StaticLayoutFactory();
        break;
        case 'agilidad':
          this.movementFactory = new AgilidadFactory();
          this.layoutFactory = new AgilityLayoutFactory();
          break;
      case 'flexibilidad':
        this.movementFactory = new FlexibilidadFactory();
        this.layoutFactory = new FlexibilityLayoutFactory();
        break;
    }
  }


  setupScene() {
    this.audioScene = this.soundFactory.create(this, { key: this.audioSettings, volume: 1, loop: true });
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

    this.buttonShowLandmarks = this.buttonFactory.create(this, 1200 - 170, 52, 'out', '🕺', 95, -48);
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
      case '🕺':
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
    if(this.detectorExercise.getType() == 'Arcade') {
      this.markers = this.layoutFactory.create(this, this.bodyPoints, this.detectorExercise);
      if(this.type == 'agilidad') {
        this.detectorExercise.createContactBall();
      }
      this.detectorExercise.setBodyPoints(this.bodyPoints);
      this.detectorExercise.setMarkers(this.markers);
    }

    this.buttonsReady.forEach((button) => {
      if (button.getText() != '[➔' && button.getText() != '🕺')
        button.destroy();
    });
    this.audioScene.play();
    this.getReadyLeft = false;
    this.getReadyRight = false;
    this.sound.pauseOnBlur = false;
  }

  movePointsAgilidad(coords: IPoseLandmark[] | undefined) {
    if (this.bodyPoints && coords) {
      for (var i = 0; i < this.bodyPoints.length; i++) {
        if (i == 34) { // To extend hands points (improve accuracy)
          this.bodyPoints[i]?.setPosition(coords[19]?.x * 1280 + 20, coords[19]?.y * 720 - 40);
        } else if (i == 35) {
          this.bodyPoints[i]?.setPosition(coords[20]?.x * 1280 - 20, coords[20]?.y * 720 - 40);
        } else {
          this.bodyPoints[i]?.setPosition(coords[i]?.x * 1280, coords[i]?.y * 720);
        }
      }
    }
  }



  stopScene() {
    this.saveData();
    this.sound.stopAll();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }

  saveData() {
    let date: string = Utils.getActualDate();
    let statsData = new StatsData(this.type, date, this.currentLevel, this.counter, this.untouchedMarkers, this.totalTouchableMarkers);
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
        if(this.detectorExercise.getType() == 'agilidad' || this.detectorExercise.getType() == 'flexibilidad') {
          this.movePointsAgilidad(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined);
        } else {
          MovePoints.movePoints(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined, this.bodyPoints, this.movementSettings);
        }
        if(this.workoutStarted ) {
          this.detectorExercise.isReady = true;
          if (this.workoutEnded) {
            return;
          }
          if (this.detectorExercise.update(poseTrackerResults)) {
            this.updateCounter();
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
        if (this.remainingTime > 0) {
          this.remainingTime--;
        }
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
          this.workoutEnded = true;
          this.showEndAnimation(false);
        } else if (this.counter >= this.workoutConfig.reps ) {
          this.workoutEnded = true;
          this.showEndAnimation(true);
        }

      }
    }
  }


  updateCounter() {
    this.counter++;
    this.exp = this.counter;
    this.registry.set(Constants.REGISTER.EXP, this.exp);
    this.registry.set(Constants.REGISTER.COUNTER, this.counter);
    // Actualiza el registro de la experiencia
    this.events.emit(Constants.EVENT.UPDATEEXP); // Emite el evento de actualización de la experiencia
  }


  showEndAnimation(success: boolean) {
    const message = success ? '¡Ejercicio completado con éxito!' : '¡Ejercicio no completado!';

    console.log('showEndAnimation called, success:', success);

    if (success) {
      this.showMessage(message);
      this.showFireworks();
    } else {
      let gameOverImage = this.add.image(this.width / 2, this.height / 2, 'gameover');
      gameOverImage.setDisplaySize(this.width, this.height);
    }

    // Aumentar el tiempo de espera para asegurarnos de que las animaciones y mensajes se completen
    setTimeout(() => {
      console.log('setTimeout completed, calling stopScene');
      this.stopScene();
    }, 5000); // 5000 ms = 5 segundos
  }

  showMessage(message: string) {
    const text = this.add.text(this.width / 2, this.height / 2, message, {
      fontSize: '52px',
      color: '#fff',
      fontFamily: 'Roboto',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: {
        x: 20,
        y: 10,
      },
    });
    text.setOrigin(0.5);
    text.setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        setTimeout(() => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => text.destroy(),
          });
        }, 2000); // Asegurar que el mensaje se mantenga visible por al menos 2 segundos
      },
    });
  }

  showFireworks() {
    const particles = this.add.particles('firework');

    const emitter = particles.createEmitter({
      speed: 90,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
    });

    // Hacer que los fuegos artificiales exploten en diferentes lugares de la pantalla
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        emitter.setPosition(Math.random() * this.width, Math.random() * this.height);
        emitter.explode(50, Math.random() * this.width, Math.random() * this.height);
      }, i * 200); // Explosiones con una separación de 200 ms
    }
  }


}
