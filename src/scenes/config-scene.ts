import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButtonWithControls from '~/gameobjects/custom-button-with-controls';
import GameCreator from '~/scenes/game-creator';
import HUD from '~/scenes/hud';
import AbstractPoseTrackerScene from '~/pose-tracker-engine/abstract-pose-tracker-scene';
import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import CustomButtom from '~/gameobjects/custom-button';
import Menu from '~/scenes/menu';

const baseStyle = {
  color: '#FFFFFF',
  fontFamily: 'Roboto',
  fontSize: '30px',
  fontStyle: 'bold'
};

interface GameConfig {
  difficulty: number;
  intensity: number;
  gameLength: number;
  type: number;
  markerTypes: number;
  backgroundMusic: number;
}

const workoutConfigurations = {
  "push-ups": {
    "Principiante": { reps: 5 },
    "Esordiente": { reps: 7 },
    "Experto": { reps: 10 },
    "Avanzado": { reps: 20 },
    "Pro": { reps: 30 }
  },
  "jumping-jacks": {
    "Principiante": { reps: 5 },
    "Esordiente": { reps: 7 },
    "Experto": { reps: 10 },
    "Avanzado": { reps: 20 },
    "Pro": { reps: 30 }
  },
  "weight-lifting": {
    "Principiante": { reps: 10 },
    "Esordiente": { reps: 20 },
    "Experto": { reps: 30 },
    "Avanzado": { reps: 40 },
    "Pro": { reps: 50 }
  }
};

const IntensityConfig = {
  "tranquilo": { multiplier: 0.5, description: 'Low intensity, longer duration' },
  "normal": { multiplier: 1, description: 'Moderate intensity and duration' },
  "intenso": { multiplier: 1.5, description: 'High intensity, shorter duration' }
};

export default class ConfigScene extends AbstractPoseTrackerScene {
  private config: GameConfig;
  private bodyPoints: any[] = [];
  private buttons: any[] = [];
  private textLabels: { [key: string]: Phaser.GameObjects.Text } = {};
  public static difficultyLabels = ["Principiante", "Esordiente", "Experto", "Avanzado", "Pro"];
  private workoutTypeLabels = ["push-ups", "jumping-jacks", "weight-lifting", "agilidad", "flexibilidad", "cardio"];
  private markerTypeLabels = ["Blue", "Green", "Red", "Yellow", "Purple", "Orange", "Pink", "Brown", "Black", "White"];
  private backgroundMusicLabels = ["sky", "beat", "adrenaline", "rock/hiphop", "workout" ];
  private intensityLabels = ["tranquilo", "normal", "intenso"];
  private touchingButton: boolean = false;
  private saveButton: any;
  private buttonExitMarker;

  constructor() {
    super({ key: Constants.SCENES.CONFIG });
    this.config = { difficulty: 2, intensity: 1, gameLength: 5, type: 0, markerTypes: 0, backgroundMusic: 0 };
  }

  create() {
    super.create();

    this.buttons['difficulty'] = this.createConfigControl(700, 100, 'button', 'Difficulty', 'difficulty', ConfigScene.difficultyLabels);
    this.buttons['intensity'] = this.createConfigControl(750, 200, 'button', 'Intensity', 'intensity', this.intensityLabels);
    this.buttons['gameLength'] = this.createConfigControl(700, 300, 'button', 'Game Length', 'gameLength', Array.from({ length: 9 }, (_, i) => i));
    this.buttons['backgroundMusic'] = this.createConfigControl(750, 400, 'button', 'Background Music', 'backgroundMusic', this.backgroundMusicLabels);
    this.buttons['type'] = this.createConfigControl(700, 500, 'button', 'Workout Type', 'type', this.workoutTypeLabels);
    this.buttons['markerTypes'] = this.createConfigControl(750, 600, 'button', 'Marker Types', 'markerTypes', this.markerTypeLabels);


    this.updateMarkerTypesVisibility();

    this.events.on('valueChanged', (field, newValue) => {
      this.config[field] = newValue;
      if (field === 'difficulty' || field === 'intensity') {
        this.updateWorkoutConfig();
      }
      if (field === 'type') {
        this.updateMarkerTypesVisibility();
      }
    });

    this.saveButton = new CustomButtom(
      this,
      1150,
      680,
      'button',
      'SAVE'
    );
    this.saveButton.setScale(0.7, 0.65);
    this.addClickEventListener(this.saveButton, this.saveConfig.bind(this));

    this.buttonExitMarker = new CustomButtom(this, 1140, 102, 'out', '[➔', 95, -48);
    this.addClickEventListener(this.buttonExitMarker, this.goBack.bind(this));

    // Agregar los botones a la escena y habilitar la física
    this.add.existing(this.saveButton);
    this.physics.world.enable(this.saveButton);
    this.saveButton.body.setAllowGravity(false);

    this.add.existing(this.buttonExitMarker);
    this.physics.world.enable(this.buttonExitMarker);
    this.buttonExitMarker.body.setAllowGravity(false);

    // Agregar detección de superposición para los botones con los puntos del cuerpo
    this.bodyPoints.forEach(point => {
      this.physics.add.overlap(this.saveButton, point, () => {
        this.saveButton.animateToFill(false);
        if (this.saveButton.buttonIsFull() && this.saveButton.isEnabled()) {
          this.saveButton.emit('down', this.saveButton);
          this.saveConfig();
        }
      }, undefined, this);

      this.physics.add.overlap(this.buttonExitMarker, point, () => {
        this.buttonExitMarker.animateToFill(false);
        if (this.buttonExitMarker.buttonIsFull() && this.buttonExitMarker.isEnabled()) {
          this.buttonExitMarker.emit('down', this.buttonExitMarker);
          this.goBack();
        }
      }, undefined, this);
    });

    // Initialize body points for pose detection
    for (let i = 0; i < 22; i++) {
      let point;
      if (i === 9) {
        point = this.physics.add.sprite(-50, -50, 'leftHand');
        point.setScale(0.2);
      } else if (i === 10) {
        point = this.physics.add.sprite(-50, -50, 'rightHand');
        point.setScale(0.2);
      } else {
        point = this.physics.add.sprite(-20, -20, 'point');
        point.setAlpha(0);
      }
      this.add.existing(point);
      this.bodyPoints.push(point);
    }

    this.setupButtonInteractions();
    this.addOverlapNavsButtons();
  }

  addClickEventListener(button: Phaser.GameObjects.GameObject, callback: () => void) {
    button.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, callback);
  }
  addOverlapNavsButtons() {
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
  }

  updateMarkerTypesVisibility() {
    const isVisible = [3, 4, 5].includes(this.config.type);
    if (this.buttons['markerTypes']) {
      this.buttons['markerTypes'].setVisible(isVisible);
    }
    if (this.textLabels['markerTypes']) {
      this.textLabels['markerTypes'].setVisible(isVisible);
    }
  }

  createConfigControl(x: number, y: number, texture: string, label: string, configField: string, values: any[]): CustomButtonWithControls {
    const text = this.add.text(200, y, `${label}: `, {
      ...baseStyle,
      align: 'left'
    }).setOrigin(0, 0.5);

    this.textLabels[configField] = text;
    const button = new CustomButtonWithControls(this, x, y, texture, this.config[configField], configField, values);
    this.add.existing(button);
    this.physics.world.enable(button);

    // Add overlap detection with body points (hand tracking)
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

  setupButtonInteractions() {
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
      intensity: this.buttons['intensity'].getIndex().toString(),
      gameLength: this.buttons['gameLength'].getIndex(),
      type: this.workoutTypeLabels[this.buttons['type'].getIndex()],
      markerTypes: this.markerTypeLabels[this.buttons['markerTypes'].getIndex()],
      backgroundMusic: this.backgroundMusicLabels[this.buttons['backgroundMusic'].getIndex()],
      workoutConfig: this.getWorkoutConfig()
    };
    this.registry.set('game-config', configCopy);
    console.log('Configuración guardada:', configCopy);

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

  getWorkoutConfig() {
    const difficulty = ConfigScene.difficultyLabels[this.config.difficulty];
    const workoutType = this.workoutTypeLabels[this.config.type];
    const intensity = this.intensityLabels[this.config.intensity];
    const intensityConfig = IntensityConfig[intensity];

    if (workoutConfigurations[workoutType] && workoutConfigurations[workoutType][difficulty]) {
      const baseConfig = workoutConfigurations[workoutType][difficulty];
      const adjustedReps = baseConfig.reps * intensityConfig.multiplier;
      const time = this.config.gameLength * 60;
      return { ...baseConfig, reps: adjustedReps, time: time };
    }

    return null;
  }

  updateWorkoutConfig() {
    const difficulty = ConfigScene.difficultyLabels[this.config.difficulty];
    const workoutType = this.workoutTypeLabels[this.config.type];
    const intensity = this.intensityLabels[this.config.intensity];
    const intensityConfig = IntensityConfig[intensity];

    if (workoutConfigurations[workoutType] && workoutConfigurations[workoutType][difficulty]) {
      const baseConfig = workoutConfigurations[workoutType][difficulty];
      const adjustedReps = baseConfig.reps * intensityConfig.multiplier;
      const time = this.config.gameLength * 60;
      this.config['workoutConfig'] = { ...baseConfig, reps: adjustedReps, time: time };
      console.log(`Updated Workout Config: Difficulty: ${difficulty}, Type: ${workoutType}, Intensity: ${intensity}, Reps: ${adjustedReps}, Time: ${time}`);
    } else {
      console.error(`Workout configuration not found for type: ${workoutType}, difficulty: ${difficulty}`);
    }
  }

  movePoints(coords: IPoseLandmark[] | undefined) {
    if (this.bodyPoints && coords) {
      for (let i = 0; i < this.bodyPoints.length; i++) {
        if (i === 9 || i === 10) {
          this.bodyPoints[i].setPosition(coords[i + 11]?.x * 1280, coords[i + 11]?.y * 720);
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
        shouldDrawFrame: false,
        shouldDrawPoseLandmarks: false,
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
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.Menu))
      this.scene.add(Constants.SCENES.Menu, Menu, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.Menu);
  }
}
