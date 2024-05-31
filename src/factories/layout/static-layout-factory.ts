import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';

export class StaticLayoutFactory implements ILayoutFactory {
  markers: Marker[] = [];
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[], detectorExercise: any): Marker[] {
    let width: number = 225;
    let height: number = 150;
    let shortRow: boolean = true;
    let counterRow = 0;
    let triggerChangeRow: boolean = false;
    for (var i = 1; i < 15; i++) {
      const marker = new Marker({
        scene: scene,
        x: width,
        y: height,
        texture: Constants.MARKER.ID,
        id: i,
      });
      counterRow++;
      if (shortRow) {
        if (counterRow == 2) {
          height = height + 125;
          width = 100;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          width = width + 830;
        }
      }
      if (!shortRow) {
        if (counterRow == 4) {
          height = height + 125;
          width = 225;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          if (i % 2 == 0) {
            width = width + 580;
          } else {
            width = width + 250;
          }
        }
      }
      if (triggerChangeRow) {
        shortRow = !shortRow;
        triggerChangeRow = false;
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
