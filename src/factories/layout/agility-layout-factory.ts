import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';

export class AgilityLayoutFactory implements ILayoutFactory {
  markers: Marker[] = [];
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[], detectorExercise: any): Marker[] {
    let width: number = 50;
    let height: number = 150;

    for (var i = 1; i < 26; i++) {
      const marker = new Marker({
        scene: scene,
        x: width,
        y: height,
        texture: Constants.TRANSPARENTMARKER.ID,
        id: i,
      });
      marker.setAgilityGame(true);
      if (i % 6 == 0) {
        height = height + 170;
        width = 50;
      } else {
        if (i % 3 == 0) {
          width = width + 660;
        } else {
          width = width + 130; // 50 + 130 * 3 = 440
        }
      }

      this.markers.push(marker);
      bodyPoints.forEach((point) => {
        scene.physics.add.overlap(
          marker,
          point,
          (marker: any) => {
            if (marker.getAnimationCreated()) {
              marker.destroyMarkerAnimation(true);
              detectorExercise.destroyMarker(marker, true);
            }
          },
          undefined,
          scene,
        );
      });
    }
    return this.markers;
  }
}
