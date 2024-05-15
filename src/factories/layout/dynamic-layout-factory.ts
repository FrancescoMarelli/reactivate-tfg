export class DynamicLayoutFactory implements ILayoutFactory {
  create(scene: Phaser.Scene, config: any): void {
    const background = scene.add.image(0, 0, 'background');
    background.setOrigin(0, 0);
    background.displayWidth = scene.scale.width;
    background.displayHeight = scene.scale.height;
  }
}
