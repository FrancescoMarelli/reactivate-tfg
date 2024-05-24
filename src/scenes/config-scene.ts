import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButtonWithControls from '~/gameobjects/custom-button-with-controls';
import GameCreator from '~/scenes/game-creator';
import HUD from '~/scenes/hud';

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
    "Muy Fácil": { reps: 5 },
    "Fácil": { reps: 7 },
    "Medio": { reps: 10 },
    "Difícil": { reps: 20 },
    "Muy Difícil": { reps: 30 }
  },
  "jumping-jacks": {
    "Muy Fácil": { reps: 5 },
    "Fácil": { reps: 7 },
    "Medio": { reps: 10 },
    "Difícil": { reps: 20 },
    "Muy Difícil": { reps: 30 }
  },
  "weight-lifting": {
    "Muy Fácil": { reps: 10, },
    "Fácil": { reps: 20 },
    "Medio": { reps: 30 },
    "Difícil": { reps: 40 },
    "Muy Difícil": { reps: 50 }
  }
};

const IntensityConfig = {
  "tranquilo": { multiplier: 0.5, description: 'Low intensity, longer duration' },
  "normal": { multiplier: 1, description: 'Moderate intensity and duration' },
  "intenso": { multiplier: 1.5, description: 'High intensity, shorter duration' }
};

export default class ConfigScene extends Phaser.Scene {
  private config: GameConfig;
  private bodyPoints: Phaser.Physics.Arcade.Sprite[] = [];
  private buttons: { [key: string]: CustomButtonWithControls } = {};
  private textLabels: { [key: string]: Phaser.GameObjects.Text } = {};
  private difficultyLabels = ["Muy Fácil", "Fácil", "Medio", "Difícil", "Muy Difícil"];
  private workoutTypeLabels = ["push-ups", "jumping-jacks", "weight-lifting", "agilidad", "flexibilidad", "cardio"];
  private markerTypeLabels = ["Blue", "Green", "Red", "Yellow", "Purple", "Orange", "Pink", "Brown", "Black", "White"];
  private backgroundMusicLabels = ["agilidad", "cardio", "contactError", "tutorial", "vamos"];
  private intensityLabels = ["tranquilo", "normal", "intenso"];

  constructor() {
    super({ key: Constants.SCENES.CONFIG });
    this.config = { difficulty: 2, intensity: 1, gameLength: 5, type: 0, markerTypes: 0, backgroundMusic: 0 };
  }

  create() {
    this.buttons['difficulty'] = this.createConfigControl(800, 100, 'button', 'Difficulty', 'difficulty', this.difficultyLabels);
    this.buttons['intensity'] = this.createConfigControl(800, 200, 'button', 'Intensity', 'intensity', this.intensityLabels);
    this.buttons['gameLength'] = this.createConfigControl(800, 300, 'button', 'Game Length', 'gameLength', Array.from({ length: 9 }, (_, i) => i));
    this.buttons['backgroundMusic'] = this.createConfigControl(800, 600, 'button', 'Background Music', 'backgroundMusic', this.backgroundMusicLabels);
    this.buttons['type'] = this.createConfigControl(800, 400, 'button', 'Workout Type', 'type', this.workoutTypeLabels);
    this.buttons['markerTypes'] = this.createConfigControl(800, 500, 'button', 'Marker Types', 'markerTypes', this.markerTypeLabels);

    // Call the visibility update function after all controls are created
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

    const saveButton = this.add.text(1100, 630, 'Save', baseStyle).setInteractive(); // Cambia y de 1000 a 700
    saveButton.on('pointerdown', () => this.saveConfig());
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
    return button;
  }

  saveConfig() {
    const configCopy = {
      difficulty: this.difficultyLabels[this.buttons['difficulty'].getIndex()],
      intensity: this.buttons['intensity'].getIndex().toString(),
      gameLength: this.buttons['gameLength'].getIndex(),
      type: this.workoutTypeLabels[this.buttons['type'].getIndex()],
      markerTypes: this.markerTypeLabels[this.buttons['markerTypes'].getIndex()],
      backgroundMusic: this.backgroundMusicLabels[this.buttons['backgroundMusic'].getIndex()],
      workoutConfig: this.getWorkoutConfig()
    };
    // Guarda los datos de configuración en el registro
    this.registry.set('game-config', configCopy);
    console.log('Configuración guardada:', configCopy);

    this.scene.stop();

    // Check if the scene 'GAME_CREATOR' already exists
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
    const difficulty = this.difficultyLabels[this.config.difficulty];
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
    const difficulty = this.difficultyLabels[this.config.difficulty];
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
}
