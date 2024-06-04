import Phaser from 'phaser';
import CustomButton from '~/gameobjects/custom-button';

export default class CustomButtonWithControls extends CustomButton {
  plusButton: Phaser.GameObjects.Rectangle;
  minusButton: Phaser.GameObjects.Rectangle;
  private lastChangeTime: number = 0;
  private changeDelay: number = 800; // Delay in milliseconds

  private buttonText: Phaser.GameObjects.Text;
  private values: any[];
  private currentIndex: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    upTexture: string,
    initialIndex: number,
    private configField: string,
    values: any[]
  ) {
    super(scene, x, y, upTexture);
    this.values = values;
    this.currentIndex = initialIndex;

    if (this.currentIndex === -1) {
      console.error(`Initial value ${initialIndex} not found in values`);
      return;
    }

    const buttonHeight = this.height;

  // En el constructor, después de crear los botones
    this.plusButton = scene.add.rectangle(this.width / 2 + 30, 0, buttonHeight, buttonHeight, 0x00FF00).setInteractive();
    this.minusButton = scene.add.rectangle(-this.width / 2 - 30, 0, buttonHeight, buttonHeight, 0xFF0000).setInteractive();

    // Agrega texto a los botones
    let plusButtonText = scene.add.text(this.width / 2 + 30, 0, "➡", { fontFamily: 'Russo One', fontSize: '40px', color: '#FFFFFF' }).setOrigin(0.5).setScale(1).setInteractive();
    let minusButtonText = scene.add.text(-this.width / 2 - 30, 0, "⬅", { fontFamily: 'Russo One', fontSize: '40px', color: '#FFFFFF' }).setOrigin(0.5).setScale(1).setInteractive();
    // Asegúrate de que el texto se muestre encima de los botones
    plusButtonText.setDepth(1);
    minusButtonText.setDepth(1);

    this.add([this.plusButton, this.minusButton, plusButtonText, minusButtonText]);
    this.scene.physics.world.enable([this.plusButton, this.minusButton]);

    this.plusButton.on('pointerdown', () => this.changeValue(1));
    this.minusButton.on('pointerdown', () => this.changeValue(-1));
    plusButtonText.on('pointerdown', () => this.changeValue(1));
    minusButtonText.on('pointerdown', () => this.changeValue(-1))


    this.buttonText = scene.add.text(0, 0, values[this.currentIndex], {
      fontFamily: 'Russo One',
      fontSize: '40px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.add(this.buttonText);
    this.setScale(1.2, 1.2)
  }

  changeValue(delta: number) {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastChangeTime > this.changeDelay) {
      this.currentIndex = Math.max(0, Math.min(this.currentIndex + delta, this.values.length - 1));
      this.buttonText.setText(this.values[this.currentIndex]);
      this.scene.events.emit('valueChanged', this.configField, this.currentIndex);
      this.lastChangeTime = currentTime;
    }
  }

  getIndex(): number {
    return this.currentIndex;
  }

  getValues(): any[] {
    return this.values;
  }

  getField(): string {
    return this.configField;
  }

  setIndex(index: number) {
    this.currentIndex = index;
    this.buttonText.setText(this.values[this.currentIndex]);
  }

  // Añadimos los métodos `animateToEmpty` y `animateToFill`
  animateToFill(mouseAction: boolean): void {
    this.cancelAnimationEmpty = true;
    if ((this.overImage.width < this.barWidth) && (mouseAction === false)) {
      this.overImage.width = this.overImage.width + 2;
    } else if (mouseAction) {
      this.overImage.width = this.barWidth;
    }
  }

  animateToEmpty(mouseAction: boolean): void {
    this.cancelAnimationEmpty = false;
    if ((this.overImage.width > 0) && (mouseAction === false)) {
      while (this.overImage.width > 0 && !this.cancelAnimationEmpty) {
        this.overImage.width = this.overImage.width - 0.5;
      }
    } else if (mouseAction) {
      this.overImage.width = 0;
    }
  }
  getType() {
    return 'CustomButtonWithControls';
  }
}
