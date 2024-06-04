import Phaser from 'phaser';
import Constants from '~/constants';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import GameCreator from '~/scenes/game-creator';
import ConfigScene from '~/scenes/config-scene';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';
import { BackgroundSoundFactory } from '~/factories/sound/background-sound-factory';

export default class ArticulationSelectionScene extends Phaser.Scene {
  private selectedIndices: Set<number> = new Set();
  // Extract only the string labels from the enum
  private articulationLabels: string[] = Object.values(EPoseLandmark).filter(value => typeof value === 'string') as string[];
  private confirmButton: Phaser.GameObjects.Text;
  private cancelButton: Phaser.GameObjects.Text;


  constructor() {
    super({ key: Constants.SCENES.ARTICULATIONMENU });
  }

  create() {
    this.add.image(640, 360, 'background').setScale(0.8);
    const darkenOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000);
    darkenOverlay.setOrigin(0, 0);
    darkenOverlay.setAlpha(0.7);

    this.add.text(100, 50, 'Selecciona Articulaciones', { fontSize: '45px', color: '#0c35de', fontFamily: 'Russo One' });

    const third = Math.ceil(this.articulationLabels.length / 3);

    // Create option texts
    this.articulationLabels.forEach((label, index) => {
      let x;
      if (index < third) {
        x = 100;  // First column
      } else if (index < 2 * third) {
        x = 500;  // Second column
      } else {
        x = 900;  // Third column
      }


      // Confirm button
      const y = index < third ? 100 + index * 45 : index < 2 * third ? 100 + (index - third) * 45 : 100 + (index - 2 * third) * 45;

      const optionText = this.add.text(x,
        y,
        label,
        { color: '#FFFFFF', fontFamily: 'Russo One', fontSize: '38px', fontStyle: 'bold', align: 'justify' })
        .setInteractive()
        .on('pointerdown', () => this.toggleOption(index, optionText));
    });

    // Confirm button
    this.confirmButton = this.add.text(400, third * 30 + 150 + 180, 'CONFIRMAR', { color: '#00FF00', fontFamily: 'Russo One', fontSize: '32px', fontStyle: 'bold' })
      .setInteractive()
      .on('pointerdown', () => this.confirmSelection());

    // Cancel button
    this.cancelButton = this.add.text(750, third * 30 + 150 + 180, 'CANCELAR', { color: '#FF0000', fontFamily: 'Russo One', fontSize: '32px', fontStyle: 'bold' })
      .setInteractive()
      .on('pointerdown', () => this.cancelSelection());
  }

  private toggleOption(index: number, optionText: Phaser.GameObjects.Text) {
    if (this.selectedIndices.has(index)) {
      this.selectedIndices.delete(index);
      optionText.setColor('#FFFFFF');
    } else {
      this.selectedIndices.add(index);
      optionText.setColor('#00FF00');
    }
  }

  private confirmSelection() {
    if (this.selectedIndices.size === 0) {
      this.articulationLabels.forEach((_, index) => this.selectedIndices.add(index));
    }

    const selectedArticulations = Array.from(this.selectedIndices).map(index => this.articulationLabels[index]);
    this.registry.set('selectedArticulations', selectedArticulations);
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.CONFIG)) {
      this.scene.add(Constants.SCENES.CONFIG, ConfigScene, false, { x: 400, y: 300, sound: false});
    }
    this.scene.start(Constants.SCENES.CONFIG);
  }

  private cancelSelection() {
    this.articulationLabels.forEach((_, index) => this.selectedIndices.add(index));
    this.scene.stop();
    if (!this.scene.get(Constants.SCENES.CONFIG)) {
      this.scene.add(Constants.SCENES.CONFIG, ConfigScene, false, { x: 400, y: 300, sound: false});
    }
    this.scene.start(Constants.SCENES.CONFIG);
  }
}
