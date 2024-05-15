export class StandardSilhouetteFactory implements ISilhouetteFactory {
  public create(scene: Phaser.Scene, x: number, y: number, texture: string):  Phaser.GameObjects.Image {
    let silhouette = scene.add.image(x, y, texture);
    silhouette.setScale(0.7, 0.65);
    return silhouette;
  }
}
