import Phaser from 'phaser';
import CustomButton from '~/gameobjects/custom-button';

export default class CustomButtonWithControls extends CustomButton {
  private plusButton: Phaser.GameObjects.Rectangle;
  private minusButton: Phaser.GameObjects.Rectangle;
  private buttonText: Phaser.GameObjects.Text;
  private values: any[]; // Puede ser un array de strings o números
  private currentIndex: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    upTexture: string,
    initialValue: any,
    private configField: string,
    values: any[]
  ) {
    super(scene, x, y, upTexture);

    this.values = values;
    this.currentIndex = values.indexOf(initialValue);
    const buttonHeight = this.height;

    this.plusButton = scene.add.rectangle(this.width / 2 + 30, 0, buttonHeight, buttonHeight, 0x00FF00).setInteractive();
    this.minusButton = scene.add.rectangle(-this.width / 2 - 30, 0, buttonHeight, buttonHeight, 0xFF0000).setInteractive();

    this.add([this.plusButton, this.minusButton]);

    this.plusButton.on('pointerdown', () => this.changeValue(1));
    this.minusButton.on('pointerdown', () => this.changeValue(-1));

    this.buttonText = scene.add.text(0, 0, values[this.currentIndex].toString(), {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.add(this.buttonText);
  }

  private changeValue(delta: number) {
    this.currentIndex = Math.max(0, Math.min(this.currentIndex + delta, this.values.length - 1));
    this.buttonText.setText(this.values[this.currentIndex].toString());
    this.scene.events.emit('valueChanged', this.configField, this.currentIndex + 1);
  }

setText(s: string) {
    super.setText(s);
  }
}
