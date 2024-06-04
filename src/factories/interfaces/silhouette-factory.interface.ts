interface ISilhouetteFactory {
   create(scene: Phaser.Scene, x: number, y: number, texture: string): Phaser.GameObjects.Image;
}
