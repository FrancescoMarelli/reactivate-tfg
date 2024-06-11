import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButtonWithControls from '~/gameobjects/custom-button-with-controls';
import GameCreator from '~/scenes/game-creator';
import HUD from '~/scenes/hud';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import CustomButton from '~/gameobjects/custom-button';
import Menu from '~/scenes/menu';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';
import { BackgroundSoundFactory } from '~/factories/sound/background-sound-factory';
import { MediapipePoseDetector } from '~/pose-tracker-engine/adaptadores/mediapipe-pose-detector';
import ArticulationSelectionScene from '~/scenes/config-scenes/articulation-selection-scene';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import { Abs } from '@tensorflow/tfjs-core';
import Loader from '~/scenes/loader';


const baseStyle = {
  color: '#FFFFFF',
  fontFamily: 'Russo One',
  fontSize: '40px',
  fontStyle: 'bold'
};

interface GameConfig {
  difficulty: number;
  intensity: number;
  type: number;
  theme: number;
  backgroundMusic: number;
}

const workoutConfigurations = {
  "Flexiones": {
    "Principiante": { reps: 7, time: 60 },
    "Esordiente": { reps: 10, time: 60 },
    "Experto": { reps: 12, time: 60 },
    "Avanzado": { reps: 15, time: 60 },
    "Pro": { reps: 20, time: 60 }
  },
  "Saltos de tijera": {
    "Principiante": { reps: 20, time: 60 },
    "Esordiente": { reps: 25, time: 60 },
    "Experto": { reps: 30, time: 60 },
    "Avanzado": { reps: 35, time: 60 },
    "Pro": { reps: 40, time: 60 }
  },
  "Pesos": {
    "Principiante": { reps: 20, time: 60 },
    "Esordiente": { reps: 30, time: 60 },
    "Experto": { reps: 40, time: 60 },
    "Avanzado": { reps: 50, time: 60 },
    "Pro": { reps: 60, time: 60 }
  },
  "Agilidad": {
    "Principiante": { reps: 40, time: 180 },
    "Esordiente": { reps: 50, time: 180 },
    "Experto": { reps: 60, time: 180 },
    "Avanzado": { reps: 70, time: 180 },
    "Pro": { reps: 90, time: 180 }
  },
  "Flexibilidad": {
    "Principiante": { reps: 60, time: 180 },
    "Esordiente": { reps: 100, time: 180 },
    "Experto": { reps: 120, time: 180 },
    "Avanzado": { reps: 150, time: 180 },
    "Pro": { reps: 180, time: 180 }
  },
  "Cardio": {
    "Principiante": { reps: 40, time: 180 },
    "Esordiente": { reps: 50, time: 180 },
    "Experto": { reps: 60, time: 180 },
    "Avanzado": { reps: 70, time: 180 },
    "Pro": { reps: 90, time: 180 }
  }
};

const IntensityConfig = {
  "Tranquilo": { multiplier: 0.5, description: 'Low intensity, longer duration' },
  "Normal": { multiplier: 1, description: 'Moderate intensity and duration' },
  "Intenso": { multiplier: 1.5, description: 'High intensity, shorter duration' }
};

export default class ConfigScene extends AbstractPoseTrackerScene {
  private config: GameConfig;
  private bodyPoints: any[] = [];
  private buttons: any[] = [];
  private textLabels: { [key: string]: Phaser.GameObjects.Text } = {};
  public static readonly difficultyLabels = ["Principiante", "Esordiente", "Experto", "Avanzado", "Pro"];
  private workoutTypeLabels = ["Flexiones", "Saltos de tijera", "Pesos", "Flexibilidad", "Agilidad", "Cardio"];
  private themeLabels = ["Default", "Medieval", "Japon", "Futuro"];
  private intensityLabels = ["Tranquilo", "Normal", "Intenso"];
  private selectArticulationsButton: Phaser.GameObjects.Text;
  private touchingButton: boolean = false;
  private saveButton: any;
  private buttonExitMarker;
  private audioScene: Phaser.Sound.BaseSound; // Correct type for audio
  private soundFactory: ISoundFactory;
  private poseSelectionButton: any;
  private navButtons: any[] = [];
  private articulationButton: any;
  private intensity: any;

  private switchPoseButton;




  constructor() {
    super({ key: Constants.SCENES.CONFIG });
    this.config = { difficulty: 2, intensity: 1, type: 0, theme: 0, backgroundMusic: 0 };
    this.soundFactory = new BackgroundSoundFactory();
    this.intensity = IntensityConfig[this.intensityLabels[this.config.intensity]].multiplier;
  }

  create() {
    super.create();
    if (!this.audioScene || !this.audioScene.isPlaying) {
      this.audioScene = this.soundFactory.create(this, { key: 'sky', volume: 0.8, loop: true });
    }
    this.add.image(640, 360, 'background').setScale(0.8);
    const darkenOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000);
    darkenOverlay.setOrigin(0, 0);
    darkenOverlay.setAlpha(0.7);

    // creación de botones de configuración
    this.buttons['difficulty'] = this.createConfigControl(710, 100, 'button', 'Difficultad', 'difficulty', ConfigScene.difficultyLabels);
    this.buttons['intensity'] = this.createConfigControl(710, 250, 'button', 'Intensidad', 'intensity', this.intensityLabels);
    this.buttons['type'] = this.createConfigControl(710, 400, 'button', 'Entrenamiento', 'type', this.workoutTypeLabels);
    this.buttons['theme'] = this.createConfigControl(710, 550, 'button', 'Tema', 'theme', this.themeLabels);


    this.articulationButton = new CustomButton(this,160, 670, 'button', 'Juntas');
    this.articulationButton.setScale(0.7, 0.75);
    this.navButtons.push(this.articulationButton);

    this.updateArticulationsVisibility();

    this.events.on('valueChanged', (field, newValue) => {
      this.config[field] = newValue;
      if (field === 'difficulty' || field === 'intensity') {
        this.updateWorkoutConfig();
      }
      if (field === 'type') {
         this.updateArticulationsVisibility();
      }

    });

    this.createNavButtons();
    this.initializeBodyPoints();
    this.setParamButtonsMouseInteractions();
    this.overlapMenuButtons(); //realiza animaciones de botones y eventos customs buttons
  }

  updateArticulationsVisibility() {
    const isVisible = [3, 4, 5].includes(this.config.type);
    if (this.buttons['type']) {
      this.articulationButton.setVisible(isVisible);
    } else {
      this.articulationButton.setVisible(false);
    }
  }

  private switchModel() {
    Loader._usingPoseNet = !Loader._usingPoseNet;
    this.switchPoseButton.setText(Loader._usingPoseNet ? 'Posenet' : 'Mediapipe');
  }


  createNavButtons() {
    this.saveButton = new CustomButton(this, 1140, 670, 'button', 'Guardar');
    this.saveButton.setScale(0.7, 0.75);
    this.navButtons.push(this.saveButton);

    this.buttonExitMarker = new CustomButton(this, 1140, 102, 'out', '[➔', 95, -48);
    this.navButtons.push(this.buttonExitMarker);

    this.poseSelectionButton = new CustomButton(this, 1140, 222, 'out', '🕺', 95, -48);
    this.navButtons.push(this.poseSelectionButton);

    this.switchPoseButton = new CustomButton(this, 400, 670, 'button', 'Mediapipe');
    this.switchPoseButton.setScale(0.7, 0.75);
    this.navButtons.push(this.switchPoseButton);


    this.addClickEventListener(this.saveButton, this.saveConfig.bind(this));
    this.addClickEventListener(this.buttonExitMarker, this.goBack.bind(this));
    this.addClickEventListener(this.poseSelectionButton, this.togglePoseSelection.bind(this));
    this.addClickEventListener(this.articulationButton, this.openArticulationSelectionScene.bind(this));
    this.addClickEventListener(this.switchPoseButton, this.switchModel.bind(this));

    this.enableButtons(this.navButtons);

  }

  enableButtons(buttons: any[]) {
    buttons.forEach(button => {
      this.add.existing(button);
      this.physics.world.enable(button);
      button.body.setAllowGravity(false);
    });
  }

  initializeBodyPoints() {

    for (let i = 0; i < 22; i++) {
      let point;
      if (i === EPoseLandmark.RightWrist) {
        point = this.physics.add.sprite(-50, -50, 'leftHand');
        point.setScale(0.2);
      } else if (i ===  EPoseLandmark.LeftWrist) {
        point = this.physics.add.sprite(-50, -50, 'rightHand');
        point.setScale(0.2);
      } else {
        point = this.physics.add.sprite(-20, -20, 'point');
        point.setAlpha(0);
      }
      this.add.existing(point);
      this.bodyPoints.push(point);
    }
  }

  togglePoseSelection() {
    MediapipePoseDetector.showLandmarks = ! MediapipePoseDetector.showLandmarks;
    if (MediapipePoseDetector.showLandmarks) {
      this.initializeBodyPoints();
      this.enableButtons(this.buttons);
      this.enableButtons(this.navButtons);

      // Asegurarse de que se configuren las superposiciones
      Object.values(this.buttons).forEach(button => {
        this.overlapParamsButtons(button);
      });

      this.overlapMenuButtons();
      this.setParamButtonsMouseInteractions();
    } else {
      this.destroyBodyPoints();
    }
  }

  destroyBodyPoints() {
    this.bodyPoints.forEach(point => {
      point.destroy();
    });
    this.bodyPoints = [];
  }

  overlapParamsButtons(button: CustomButtonWithControls): CustomButtonWithControls {
    this.add.existing(button);
    this.physics.world.enable(button);

    // Central  button overlap animation (la dejo o no?)
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(button, point, () => {
        button.animateToFill(false);
        this.touchingButton = true;
        if (button.buttonIsFull() && button.isEnabled()) {
          button.emit('down', button);
        }
      }, undefined, this);
    });

    // Add overlap detection for plus and minus buttons
    this.physics.add.overlap(button.plusButton, this.bodyPoints, () => {
      this.touchingButton = true;
      button.changeValue(1);
    }, undefined, this);

    this.physics.add.overlap(button.minusButton, this.bodyPoints, () => {
      this.touchingButton = true;
      button.changeValue(-1);
    }, undefined, this);

    return button;
  }

  addClickEventListener(button: Phaser.GameObjects.GameObject, callback: () => void) {
    button.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, callback);
  }

  overlapMenuButtons() {
    this.add.existing(this.saveButton);
    this.physics.world.enable(this.saveButton);
    this.saveButton.body.setAllowGravity(false);
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.saveButton, point, () => {
        this.saveButton.animateToFill(false);
        this.touchingButton = true;
        if (this.saveButton.buttonIsFull() && this.saveButton.isEnabled()) {
          this.saveButton.emit('down', this.saveButton);
          this.saveConfig();
        }
      }, undefined, this);
    });

    this.add.existing(this.buttonExitMarker);
    this.physics.world.enable(this.buttonExitMarker);
    this.buttonExitMarker.body.setAllowGravity(false);
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.buttonExitMarker, point, () => {
        this.buttonExitMarker.animateToFill(false);
        this.touchingButton = true;
        if (this.buttonExitMarker.buttonIsFull() && this.buttonExitMarker.isEnabled()) {
          this.buttonExitMarker.emit('down', this.buttonExitMarker);
          this.goBack();
        }
      }, undefined, this);
    });

    this.add.existing(this.poseSelectionButton);
    this.physics.world.enable(this.poseSelectionButton);
    this.poseSelectionButton.body.setAllowGravity(false);
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.poseSelectionButton, point, () => {
        this.poseSelectionButton.animateToFill(false);
        this.touchingButton = true;
        if (this.poseSelectionButton.buttonIsFull() && this.poseSelectionButton.isEnabled()) {
          this.poseSelectionButton.emit('down', this.poseSelectionButton);
          this.togglePoseSelection();
        }
      }, undefined, this);
    });

    this.add.existing(this.articulationButton);
    this.physics.world.enable(this.articulationButton);
    this.articulationButton.body.setAllowGravity(false);
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.articulationButton, point, () => {
        this.articulationButton.animateToFill(false);
        this.touchingButton = true;
        if (this.articulationButton.buttonIsFull() && this.articulationButton.isEnabled()) {
          this.articulationButton.emit('down', this.articulationButton);
          this.openArticulationSelectionScene();
        }
      }, undefined, this);
    });

    this.add.existing(this.switchPoseButton);
    this.physics.world.enable(this.switchPoseButton);
    this.switchPoseButton.body.setAllowGravity(false);
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.switchPoseButton, point, () => {
        this.switchPoseButton.animateToFill(false);
        this.touchingButton = true;
        if (this.switchPoseButton.buttonIsFull() && this.switchPoseButton.isEnabled()) {
          this.switchPoseButton.emit('down', this.switchPoseButton);
          this.switchModel();
        }
      }, undefined, this);
    });
  }


  createConfigControl(x: number, y: number, texture: string, label: string, configField: string, values: any[]): CustomButtonWithControls {
    const text = this.add.text(90, y, `${label} `, {
      ...baseStyle,
      align: 'left'
    }).setOrigin(0, 0.5);

    this.textLabels[configField] = text;
    const button = new CustomButtonWithControls(this, x, y, texture, this.config[configField], configField, values);
    return this.overlapParamsButtons(button);
  }

  setParamButtonsMouseInteractions() {
    this.buttons.forEach(button => {
      button.setInteractive()
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
          button.animateToFill(true);
        })
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
          button.animateToEmpty(true);
        })
        .on('down', () => {
          button.animateToFill(true);
          if (button.buttonIsFull() && button.isEnabled()) {
            this.handleButtonAction(button);
          }
        })
        .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
          button.animateToFill(true);
          if (button.buttonIsFull() && button.isEnabled()) {
            this.handleButtonAction(button);
          }
        });
    });
  }

  handleButtonAction(button: CustomButtonWithControls) {
      const field = button.getField();
      const currentIndex = button.getIndex();
      const values = button.getValues();
      const newValue = (currentIndex + 1) % values.length;
      button.setIndex(newValue);
      button.setText(values[newValue]);

      this.events.emit('valueChanged', field, newValue);
  }

  saveConfig() {
    const configCopy = {
      difficulty: ConfigScene.difficultyLabels[this.buttons['difficulty'].getIndex()],
      intensity: this.intensity,
      gameLength: this.getWorkoutConfig().time,
      type: this.workoutTypeLabels[this.buttons['type'].getIndex()],
      theme: this.themeLabels[this.buttons['theme'].getIndex()],
      workoutConfig: this.getWorkoutConfig(),
    };
    this.registry.set('game-config', configCopy);
    console.log('Configuración guardada:', configCopy);
    this.audioScene.stop();
    this.scene.stop();

    if (!this.scene.get(Constants.SCENES.GAME_CREATOR)) {
      this.scene.add(Constants.SCENES.GAME_CREATOR, GameCreator, false, { x: 400, y: 300 });
    }
    if (!this.scene.get(Constants.SCENES.HUD)) {
      this.scene.add(Constants.SCENES.HUD, HUD, false, { x: 400, y: 300 });
    }
    this.scene.start(Constants.SCENES.GAME_CREATOR);
    this.scene.start(Constants.SCENES.HUD);
    this.scene.bringToTop(Constants.SCENES.HUD);
  }

  openArticulationSelectionScene() {
    this.registry.set('usingPoseNet', Loader._usingPoseNet);
    this.scene.stop();
    if(!this.scene.get(Constants.SCENES.ARTICULATIONMENU )) {
      this.scene.add(Constants.SCENES.ARTICULATIONMENU , ArticulationSelectionScene, false, { x: 400, y: 300});
    }
    this.scene.start(Constants.SCENES.ARTICULATIONMENU );
  }

  getWorkoutConfig() {
    const difficulty = ConfigScene.difficultyLabels[this.config.difficulty];
    const workoutType = this.workoutTypeLabels[this.config.type];
    const intensity = this.intensityLabels[this.config.intensity];
    const intensityConfig = IntensityConfig[intensity];

    if (workoutConfigurations[workoutType] && workoutConfigurations[workoutType][difficulty]) {
      const baseConfig = workoutConfigurations[workoutType][difficulty];
      const adjustedReps = baseConfig.reps * intensityConfig.multiplier;
      const time = baseConfig.time;  // Corrige la multiplicación por intensidad
      return { ...baseConfig, reps: adjustedReps, time: time };
    }

    return null;
  }

  updateWorkoutConfig() {
    const difficulty = ConfigScene.difficultyLabels[this.config.difficulty];
    const workoutType = this.workoutTypeLabels[this.config.type];
    const intensity = this.intensityLabels[this.config.intensity];
    const intensityConfig = IntensityConfig[intensity];
    this.intensity = intensityConfig.multiplier;

    if (workoutConfigurations[workoutType] && workoutConfigurations[workoutType][difficulty]) {
      const baseConfig = workoutConfigurations[workoutType][difficulty];
      const adjustedReps = baseConfig.reps * intensityConfig.multiplier;
      const time = baseConfig.time;
      this.config['workoutConfig'] = { ...baseConfig, reps: adjustedReps, time: time };
      console.log(`Updated Workout Config: Difficulty: ${difficulty}, Type: ${workoutType}, Intensity: ${intensity}, Reps: ${adjustedReps}, Time: ${time}`);
    } else {
      console.error(`Workout configuration not found for type: ${workoutType}, difficulty: ${difficulty}`);
    }
  }

  movePoints(coords: IPoseLandmark[] | undefined) {
    if (this.bodyPoints && coords) {
      for (let i = 0; i < this.bodyPoints.length; i++) {
        if (i === EPoseLandmark.LeftWrist || i === EPoseLandmark.RightWrist) {
          this.bodyPoints[i].setPosition(coords[i]?.x * Constants.CANVASMULTI.WIDTHMULTI, coords[i]?.y * Constants.CANVASMULTI.HEIGHTMULTI);
        }
      }
    }
  }

  update(time: number, delta: number): void {
    if (!this.touchingButton) {
      this.buttons.forEach(button => {
        this.bodyPoints.forEach(point => {
          if (point.body && point.body.touching.none) {
            button.animateToEmpty(false);
          }
        });
      });
    }
    super.update(time, delta, {
      renderElementsSettings: {
        shouldDrawFrame: true,
        shouldDrawPoseLandmarks: true,
      },
      beforePaint: (poseTrackerResults, canvasTexture) => {
      },
      afterPaint: (poseTrackerResults) => {
        this.movePoints(poseTrackerResults.poseLandmarks ? poseTrackerResults.poseLandmarks : undefined);
      },
    });
    this.touchingButton = false;
  }

  goBack() {
    this.audioScene.stop();
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu)) {
        this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    }
    this.scene.start(Constants.SCENES.Menu);
  }
}
