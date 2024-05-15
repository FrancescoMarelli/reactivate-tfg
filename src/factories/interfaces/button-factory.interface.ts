 export interface IButtonFactory {
  create(scene: Phaser.Scene,
         x: number,
         y: number,
         upTexture: string,
         inputText?: string,
         barWidth?: number,
         initField?: number) : Phaser.GameObjects.Container;
 }
