import Phaser from 'phaser';
import Constants from '~/constants';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import GameCreator from '~/scenes/game-creator';
import ConfigScene from '~/scenes/config-scene';
import { ISoundFactory } from '~/factories/interfaces/sound-factory.interface';
import { BackgroundSoundFactory } from '~/factories/sound/background-sound-factory';
import CustomButton from '~/gameobjects/custom-button';

export default class ArticulationSelectionScene extends Phaser.Scene {
  private selectedIndices: Set<number> = new Set();
  // Extract only the string labels from the enum
  private articulationLabels: string[] = Object.values(EPoseLandmark).filter(value => typeof value === 'string') as string[];
  private confirmButton;
  private cancelButton;
  private usingPoseNet = true; // Añade tu lógica para establecer esta bandera
  private posenetArticulations = ['Nose', 'LeftEye', 'RightEye', 'LeftEar', 'RightEar', 'LeftShoulder', 'RightShoulder', 'LeftElbow', 'RightElbow', 'LeftWrist', 'RightWrist', 'LeftHip', 'RightHip', 'LeftKnee', 'RightKnee', 'LeftAnkle', 'RightAnkle']; // Articulaciones que PoseNet puede detectar


  constructor() {
    super({ key: Constants.SCENES.ARTICULATIONMENU });
  }

  create() {
    this.add.image(640, 360, 'background').setScale(0.8);
    const darkenOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000);
    darkenOverlay.setOrigin(0, 0);
    darkenOverlay.setAlpha(0.7);

    this.add.text(100, 45, 'Seleccionar las articulaciones deseadas', { fontSize: '49px', color: '#0c35de', fontFamily: 'Russo One' });

    const third = Math.ceil(this.articulationLabels.length / 3);

    // Create option texts
    this.articulationLabels.forEach((label, index) => {
      let x;
      if (index < third) {
        x = 90;  // First column
      } else if (index < 2 * third) {
        x = 510;  // Second column
      } else {
        x = 900;  // Third column
      }

      label = this.getSpanishLabel(label);

      // Confirm button
      const y = index < third ? 100 + index * 45 : index < 2 * third ? 100 + (index - third) * 45 : 100 + (index - 2 * third) * 45;

      const optionText = this.add.text(x,
        y,
        label,
        { color: '#FFFFFF', fontFamily: 'Russo One', fontSize: '34px', fontStyle: 'bold', align: 'justify' })
        .setInteractive()
        .on('pointerdown', () => this.toggleOption(index, optionText));
    });

    // Confirm button
    this.confirmButton = new CustomButton(this, 400, third * 30 + 150 + 180, 'button', 'CONFIRMAR')
      .setScale(0.7)
      .setInteractive()
      .on('pointerdown', () => this.confirmSelection());

    this.add.existing(this.confirmButton);
    this.physics.world.enable(this.confirmButton);
    this.confirmButton.body.setAllowGravity(false);

    // Cancel button
    this.cancelButton = new CustomButton(this, 850, third * 30 + 150 + 180, 'button', 'CANCELAR')
      .setScale(0.7)
      .setInteractive()
      .on('pointerdown', () => this.cancelSelection());
    this.add.existing(this.cancelButton);
    this.physics.world.enable(this.cancelButton);
    this.cancelButton.body.setAllowGravity(false);
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

  getSpanishLabel(label: string): string {
    switch (label) {
      case 'Nose':
        return 'Nariz';
      case 'LeftEyeInner':
        return 'Ojo Izquierdo Interno';
      case 'LeftEye':
        return 'Ojo Izquierdo';
      case 'LeftEyeOuter':
        return 'Ojo Izquierdo Externo';
      case 'RightEyeInner':
        return 'Ojo Derecho Interno';
      case 'RightEye':
        return 'Ojo Derecho';
      case 'RightEyeOuter':
        return 'Ojo Derecho Externo';
      case 'LeftEar':
        return 'Oreja Izquierda';
      case 'RightEar':
        return 'Oreja Derecha';
      case 'MouthLeft':
        return 'Boca Izquierda';
      case 'MouthRight':
        return 'Boca Derecha';
      case 'LeftShoulder':
        return 'Hombro Izquierdo';
      case 'RightShoulder':
        return 'Hombro Derecho';
      case 'LeftElbow':
        return 'Codo Izquierdo';
      case 'RightElbow':
        return 'Codo Derecho';
      case 'LeftWrist':
        return 'Muñeca Izquierda';
      case 'RightWrist':
        return 'Muñeca Derecha';
      case 'LeftPinky':
        return 'Menique Izquierdo';
      case 'RightPinky':
        return 'Menique Derecho';
      case 'LeftIndex':
        return 'Índice Izquierdo';
      case 'RightIndex':
        return 'Índice Derecho';
      case 'LeftThumb':
        return 'Pulgar Izquierdo';
      case 'RightThumb':
        return 'Pulgar Derecho';
      case 'LeftHip':
        return 'Cadera Izquierda';
      case 'RightHip':
        return 'Cadera Derecha';
      case 'LeftKnee':
        return 'Rodilla Izquierda';
      case 'RightKnee':
        return 'Rodilla Derecha';
      case 'LeftAnkle':
        return 'Tobillo Izquierdo';
      case 'RightAnkle':
        return 'Tobillo Derecho';
      case 'LeftHeel':
        return 'Talón Izquierdo';
      case 'RightHeel':
        return 'Talón Derecho';
      case 'LeftFootIndex':
        return 'Pie Izquierdo';
      case 'RightFootIndex':
        return 'Pie Derecho';
      default:
        return label;
    }
  }
}
