import Phaser from 'phaser';
import Marker from '~/gameobjects/marker';
import Constants from '~/constants';
import { ILayoutFactory } from '~/factories/interfaces/layout-factory.interface';

export class StaticLayoutFactory implements ILayoutFactory {
  create(scene: Phaser.Scene, bodyPoints: Phaser.Physics.Arcade.Sprite[]): Marker[] {
    let markers: Marker[] = [];
    let width: number = 225;
    let height: number = 150;
    let shortRow: boolean = true;
    let counterRow = 0;
    let triggerChangeRow: boolean = false;

    for (let i = 1; i < 15; i++) {
      const marker = new Marker({
        scene: scene,
        x: width,
        y: height,
        texture: Constants.MARKER.ID,
        id: i,
      });

      counterRow++;
      if (shortRow) {
        if (counterRow === 2) {
          height += 125;
          width = 100;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          width += 830;
        }
      } else {
        if (counterRow === 4) {
          height += 125;
          width = 225;
          triggerChangeRow = true;
          counterRow = 0;
        } else {
          width += i % 2 === 0 ? 580 : 250;
        }
      }
      if (triggerChangeRow) {
        shortRow = !shortRow;
        triggerChangeRow = false;
      }

      markers.push(marker);
      scene.physics.add.overlap(
        marker,
        bodyPoints,
        (marker: any, point: any) => {
          if (marker.getAnimationCreated()) {
            marker.destroyMarkerAnimation(true);
            // Llamar a destroyMarker si es necesario
            const cardioWorkout = scene.registry.get('cardioWorkout');
            if (cardioWorkout) {
              cardioWorkout.destroyMarker(marker, true);
            }
          }
        },
        undefined,
        scene
      );
    }
    return markers;
  }
}
