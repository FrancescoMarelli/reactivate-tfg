import { IButtonFactory } from '~/factories/interfaces/button-factory.interface';
import CustomButton from '~/gameobjects/custom-button';

export class CustomButtonFactory implements IButtonFactory {
  create(scene: Phaser.Scene,
         x: number,
         y: number,
         upTexture: string,
         inputText?: string,
         barWidth?: number,
         initField?: number) :
    Phaser.GameObjects.Container {

    let button = new CustomButton(scene, x, y, upTexture, inputText, barWidth, initField);
    button.setScale(0.9, 0.85);
    return button;
  }

}
