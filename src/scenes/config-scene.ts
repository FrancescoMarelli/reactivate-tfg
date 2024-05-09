import Phaser from 'phaser';
import Constants from '~/constants';
import CustomButtonWithControls from '~/gameobjects/custom-button-with-controls';

const baseStyle = {
  color: '#FFFFFF',
  fontFamily: 'Arial',
  fontSize: '24px',
  fontStyle: 'bold'
};

interface GameConfig {
  difficulty: number;
  speed: number;
  gameLength: number;
}


export default class ConfigScene extends Phaser.Scene {
  private config: GameConfig;
  private textLabels: { [key: string]: Phaser.GameObjects.Text } = {};
  private difficultyLabels = ["Muy Fácil", "Fácil", "Medio", "Difícil", "Muy Difícil"];

  constructor() {
    super({ key: Constants.SCENES.CONFIG });
    this.config = { difficulty: 3, speed: 5, gameLength: 5 };
  }

  create() {
    this.createConfigControl(800, 200, 'button', 'Difficulty', 'difficulty', this.difficultyLabels);
    this.createConfigControl(800, 300, 'button', 'Speed', 'speed', Array.from({ length: 20 }, (_, i) => i + 1)); // de 1 a 20
    this.createConfigControl(800, 400, 'button', 'Game Length', 'gameLength', Array.from({ length: 30 }, (_, i) => i + 1)); // de 1 a 30

    this.events.on('valueChanged', (field, newValue) => {
      this.config[field] = newValue;
      this.textLabels[field].setText(`${field}: ${this.config[field]}`);
    });
  }

  createConfigControl(x: number, y: number, texture: string, label: string, configField: string, values: any[]) {
    const textValue = values[this.config[configField] - 1];
    const text = this.add.text(200, y, `${label}: ${textValue}`, {
      ...baseStyle,
      align: 'left'
    }).setOrigin(0, 0.5);

    this.textLabels[configField] = text;
    const button = new CustomButtonWithControls(this, x, y, texture, textValue, configField, values);
    this.add.existing(button);
  }
}
