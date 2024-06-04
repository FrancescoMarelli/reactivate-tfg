import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';
import Phaser from 'phaser';
import NewMarker from '~/gameobjects/new-marker';
import { MarkerFactory } from '~/factories/markers/marker-factory';
import Constants from '~/constants';

export class AgilityLayoutFactory implements ILayoutFactory {
  markers: NewMarker[] = [];
  markerFactory: MarkerFactory = new MarkerFactory();
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[], detectorExercise: any, markerType: string): NewMarker[] {
    let width: number = 50;
    let height: number = 150;

    for (let i = 1; i < 26; i++) {
      const  marker = this.markerFactory.create(
        scene,
        {
          x: width,
          y: height,
          texture: Constants.TRANSPARENTMARKER.ID,
          id: i,
          defaultMarker: markerType,
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
