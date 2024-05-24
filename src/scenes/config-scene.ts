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
  speed: number;
  gameLength: number;
  type: number;
  markerTypes: number;
  backgroundMusic: number;
}

export default class ConfigScene extends Phaser.Scene {
  private config: GameConfig;
  private buttons: { [key: string]: CustomButtonWithControls } = {};
  private textLabels: { [key: string]: Phaser.GameObjects.Text } = {};
  private difficultyLabels = ["Muy Fácil", "Fácil", "Medio", "Difícil", "Muy Difícil"];
  private workoutTypeLabels = ["push-ups", "jumping-jacks", "weight-lifting", "agilidad", "flexibilidad", "cardio"];
  private markerTypeLabels = ["Blue", "Green", "Red", "Yellow", "Purple", "Orange", "Pink", "Brown", "Black", "White"];
  private backgroundMusicLabels = ["agilidad", "cardio", "contactError", "tutorial","vamos"];


  constructor() {
    super({ key: Constants.SCENES.CONFIG });
    this.config = { difficulty: 0, speed: 5, gameLength: 5, type: 0, markerTypes: 0, backgroundMusic: 0};
  }

  create() {
    this.buttons['difficulty'] = this.createConfigControl(800, 160, 'button', 'Difficulty', 'difficulty', this.difficultyLabels);
    this.buttons['speed'] = this.createConfigControl(800, 240, 'button', 'Speed', 'speed', Array.from({ length: 20 }, (_, i) => i + 1)); // de 1 a 20
    this.buttons['gameLength'] = this.createConfigControl(800, 320, 'button', 'Game Length', 'gameLength', Array.from({ length: 30 }, (_, i) => i + 1)); // de 1 a 30
    this.buttons['type'] = this.createConfigControl(800, 480, 'button', 'Workout Type', 'type', this.workoutTypeLabels);
    this.buttons['markerTypes'] = this.createConfigControl(800, 560, 'button', 'Marker Types', 'markerTypes', this.markerTypeLabels);
    this.buttons['backgroundMusic'] = this.createConfigControl(800, 640, 'button', 'Background Music', 'backgroundMusic', this.backgroundMusicLabels);

    this.events.on('valueChanged', (field, newValue) => {
      this.config[field] = newValue;
    });

    const saveButton = this.add.text(1100, 630, 'Save', baseStyle).setInteractive(); // Cambia y de 1000 a 700
    saveButton.on('pointerdown', () => this.saveConfig());

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
      speed: this.buttons['speed'].getIndex().toString(),
      gameLength: this.buttons['gameLength'].getIndex(),
      type: this.workoutTypeLabels[this.buttons['type'].getIndex()],
      markerTypes: this.markerTypeLabels[this.buttons['markerTypes'].getIndex()],
      backgroundMusic: this.backgroundMusicLabels[this.buttons['backgroundMusic'].getIndex()]
    }
    // Guarda los datos de configuración en el registro
    this.registry.set('game-config', configCopy);
    console.log('Configuración guardada:', configCopy);

    this.scene.stop();

    // Check if the scene 'GAME_CREATOR' already exists
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.GAME_CREATOR))
      this.scene.add(Constants.SCENES.GAME_CREATOR, GameCreator, false, { x: 400, y: 300 });
    if (!this.scene.get(Constants.SCENES.HUD))
      this.scene.add(Constants.SCENES.HUD, HUD, false, { x: 400, y: 300 });
    this.scene.start(Constants.SCENES.GAME_CREATOR);
    this.scene.start(Constants.SCENES.HUD);
    this.scene.bringToTop(Constants.SCENES.HUD);
  }

}
