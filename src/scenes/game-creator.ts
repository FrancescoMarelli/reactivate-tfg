import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButton from '~/gameobjects/custom-button';
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
import { MediapipePoseDetector } from '~/pose-tracker-engine/types/adaptadores/mediapipe-pose-detector';
import { IArcadeFactory } from '~/factories/interfaces/arcade-factory.interface';
import { AgilidadFactory } from '~/factories/workouts/agilidad-factory';
import { FlexibilidadFactory } from '~/factories/workouts/flexibilidad-factory';
import { StaticLayoutFactory } from '~/factories/layout/static-layout-factory';
import { AgilityLayoutFactory } from '~/factories/layout/agility-layout-factory';
import { FlexibilityLayoutFactory } from '~/factories/layout/flexibility-layout-factory';
import { MarkerFactory } from '~/factories/markers/marker-factory';
import { IMarkerFactory } from '~/factories/interfaces/marker-factory.interface';
import NewMarker from '~/gameobjects/new-marker';
import { IThemeFactory } from '~/factories/interfaces/theme-factory.interface';
import ThemeFactory from '~/factories/theme-factory';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';


export default class GameCreator extends AbstractPoseTrackerScene {
  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  private markers:NewMarker[] = [];

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
  private levelTime: number = 0.3;
  private remainingTime: number;
  private audioSettings;
  private theme;
  private randomMarker: number = 3;
  private movementSettings: any;
  private articulations: string[];

  private counter: number = 0;
  private counterText: Phaser.GameObjects.Text;
  private detectorExercise;
  private workoutEnded: boolean = false;
  private animationPlayed: boolean = false;


  // Factories
  private soundFactory: ISoundFactory;
  private buttonFactory: IButtonFactory;
  private movementFactory: IMovementFactory | IArcadeFactory;
  private silhouetteFactory: ISilhouetteFactory;
  private layoutFactory : ILayoutFactory;
  private themeFactory : IThemeFactory;

  private buttonShowLandmarks: Phaser.GameObjects.Container;
  private intensity: any;
  private difficulty: any;
  markerFactory: IMarkerFactory;
  background: Phaser.GameObjects.Image;
  private posGifShown: boolean = false;
  ratio: number;
  negGifShown: boolean = false;
  stopCounter: number = 0;


  constructor() {
    super(Constants.SCENES.GAME_CREATOR);
    this.silhouetteFactory = new StandardSilhouetteFactory();
    this.buttonFactory = new CustomButtonFactory();
    this.soundFactory = new BackgroundSoundFactory();
    this.markerFactory = new MarkerFactory();
    this.themeFactory = new ThemeFactory();
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
      this.theme = gameConfig.theme;
      this.audioSettings = this.theme;
      this.intensity = gameConfig.intensity;
      this.difficulty = gameConfig.difficulty;
      this.workoutConfig = gameConfig.workoutConfig;
      this.remainingTime = this.workoutConfig.time;
      this.articulations = this.registry.get('selectedArticulations');
      console.log('Articulaciones seleccionadas:', this.articulations);

      if (!this.articulations) {
        this.articulations = Object.values(EPoseLandmark).filter(value => typeof value === 'string') as string[];
        this.registry.set('selectedArticulations', this.articulations);
      }

      this.ratio = this.workoutConfig.reps / this.remainingTime;

      this.randomMarker = 3;
      this.counter = 0;

      this.registry.set(Constants.REGISTER.LEVEL, this.currentLevel);
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
     this.movementSettings = {
       activeJoints: this.articulations
     };
    this.detectorExercise = this.movementFactory.create(this);
    if(this.detectorExercise.getType() == 'Arcade')
      this.detectorExercise.setIntensity(this.intensity);

  }

  getType(): string {
    return this.type;
  }

  workoutSwitch(workout: string) {
    switch (workout) {
      case Constants.TRAINING.FLEXIONES:
        this.movementFactory = new PushUpsFactory();
        break;
      case Constants.TRAINING.PESOS:
        this.movementFactory = new WeightLiftinFactory();
        break;
      case Constants.TRAINING.SALTOSDETIJERA:
        this.movementFactory = new JumpingJackFactory();
        break;
      case Constants.TRAINING.CARDIO:
        this.movementFactory = new CardioFactory();
        this.layoutFactory = new StaticLayoutFactory();
        this.registry.set(Constants.REGISTER.MARKER_COUNT, this.counter);
        this.registry.set(Constants.REGISTER.UNTOUCHED, this.untouchedMarkers);
        break;
        case Constants.TRAINING.AGILIDAD:
          this.movementFactory = new AgilidadFactory();
          this.layoutFactory = new AgilityLayoutFactory();
          this.registry.set(Constants.REGISTER.MARKER_COUNT, this.counter);
          this.registry.set(Constants.REGISTER.UNTOUCHED, this.untouchedMarkers);
          break;
      case Constants.TRAINING.FLEXIBILIDAD:
        this.movementFactory = new FlexibilidadFactory();
        this.layoutFactory = new FlexibilityLayoutFactory();
        this.registry.set(Constants.REGISTER.MARKER_COUNT, this.counter);
        this.registry.set(Constants.REGISTER.UNTOUCHED, this.untouchedMarkers);
        break;
    }
  }



  setupScene() {
    this.audioScene = this.soundFactory.create(this, { key: this.audioSettings, volume: 0.95, loop: true });
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
    for (let i = 0; i < 35; i++) {
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

  toggleLandmarks() {
    MediapipePoseDetector.showLandmarks = !MediapipePoseDetector.showLandmarks;
  }


  menuSwitch(button: CustomButton) {
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
      this.markers = this.layoutFactory.create(this, this.bodyPoints, this.detectorExercise, this.theme);
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
    if(this.type == 'Agilidad') {
      this.detectorExercise.setTheme(this.theme);
      this.detectorExercise.createContactBall();
    }
  }

  gifSwitch(): string {
    switch (this.theme) {
      case 'Japon':
        return 'japanGif';
      case 'Default':
        return 'defaultGif';
      case 'Medieval':
        return 'medievalGif';
      case 'Futuro':
        return 'futureGif';
      default:
        return 'defaultGif';
    }
  }


  stopScene() {
    this.stopCounter++;
    if(this.stopCounter == 1) {
      this.saveData();
    }
    this.sound.stopAll();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }

  saveData() {
    let date: string = Utils.getActualDate();
    if(this.detectorExercise.getType() == 'Arcade') {
      this.untouchedMarkers = this.detectorExercise.getUntouchedMarkers();
      this.totalTouchableMarkers = this.untouchedMarkers + this.counter;
      this.currentLevel = this.detectorExercise.getLevel() ;
    } else {
      this.untouchedMarkers = 0;
      this.totalTouchableMarkers = 0;
      this.currentLevel = this.difficulty;
    }

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
        MovePoints.movePoints(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined, this.bodyPoints, this.movementSettings);
        if (this.workoutStarted) {
          this.detectorExercise.isReady = true;
          if (this.workoutEnded) {
            return;
          }
          if (this.detectorExercise.update(poseTrackerResults)) {
            this.updateCounter();
          }
        }
      },
      afterPaint: (poseTrackerResults) => {},
    });

    if (this.workoutStarted) {
      let actualRatio = this.counter / (this.workoutConfig.time - this.remainingTime);
      let lowerThresholdRatio = 0.4 * this.ratio;
      let timeThreshold = 0.7 * this.workoutConfig.time;

      if (!this.posGifShown && actualRatio > this.ratio && this.counter > 0) {
        this.showPositiveFeedback();
      } else if (!this.negGifShown && this.remainingTime <= timeThreshold && actualRatio < lowerThresholdRatio) {
        this.showNegativeFeedback();
      }

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

        if (this.detectorExercise.getType() == 'Arcade') {
          this.counter = this.detectorExercise.getTouchedMarkers();
        }

        // End of workout
        if (this.remainingTime == 0) {
          this.workoutEnded = true;
          this.showEndAnimation(false);
        } else if (this.counter >= this.workoutConfig.reps) {
          this.workoutEnded = true;
          this.showEndAnimation(true);
        }
      }
    }
  }

  showPositiveFeedback() {
    const gif = this.add.image(10, 715, this.gifSwitch()).setOrigin(0, 1);
    let cloud = this.add.image(50, 610, "cloud").setOrigin(0, 1);
    let text = this.add.text(55, 535, 'Estás yendo\n muy bien', { fontSize: '24px' }).setOrigin(0, 1).setDepth(1).setColor('#000000');
    gif.setScale(0.4);
    cloud.setScale(0.1);

    this.sound.play('welldone');
    this.posGifShown = true;

    setTimeout(() => {
      gif.destroy();
      cloud.destroy();
      text.destroy();
    }, 4000);
  }

  showNegativeFeedback() {
    const gif = this.add.image(10, 715, this.gifSwitch()).setOrigin(0, 1);
    let cloud = this.add.image(50, 610, "cloud").setOrigin(0, 1);
    let text = this.add.text(63, 512, 'Accelera !!!', { fontSize: '23px' }).setOrigin(0, 1).setDepth(1).setColor('#000000');
    gif.setScale(0.4);
    cloud.setScale(0.1);

    this.sound.play('faster');
    this.negGifShown = true;

    setTimeout(() => {
      gif.destroy();
      cloud.destroy();
      text.destroy();
    }, 4000);
  }



  updateCounter() {
    this.counter++;
    this.exp = this.counter;
    this.registry.set(Constants.REGISTER.EXP, this.exp);
    this.registry.set(Constants.REGISTER.COUNTER, this.counter);
    this.events.emit(Constants.EVENT.UPDATEEXP);
  }


  showEndAnimation(success: boolean) {
    if (!this.animationPlayed) {
      this.animationPlayed = true;
      const message = success ? '¡Ejercicio completado con éxito!' : '¡Ejercicio no completado!';

      console.log('showEndAnimation called, success:', success);

      if (success) {
        this.showMessage(message);
        this.showFireworks();
      } else {
        let gameOverImage = this.add.image(this.width / 2, this.height / 2, 'gameover');
        gameOverImage.setDisplaySize(this.width / 2, this.height / 2);
      }

      setTimeout(() => {
        console.log('setTimeout completed, calling stopScene');
        this.stopScene();
      }, 5000); // 5000 ms = 5 segundos
    }
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
