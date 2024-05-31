import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import Phaser from 'phaser';


/**
 * Esta clase abstracta con este metodo estatico sirve para poder leer la articulacion con la que se quiere jugar
 * sin tener que hardcodearla.
 */
export abstract class MovePoints {

  static movePoints(coords: IPoseLandmark[] | undefined, bodyPoints: Phaser.Physics.Arcade.Sprite[] | undefined, movementSettings: any) {
    if (bodyPoints && coords) {
      const activeIndices = movementSettings.activeJoints.map(joint => EPoseLandmark[joint as keyof typeof EPoseLandmark]);

      activeIndices.forEach((index, i) => {
        const coord = coords?.[index];
        const bodyPoint = bodyPoints?.[i];
        if (coord && bodyPoint) {
          const adjustedIndex = i + 11;

          // Determina si es un caso especial
          let offsets = { x: 0, y: 0 };
          if (adjustedIndex === 23) {
            offsets = { x: 20, y: -40 };
          } else if (adjustedIndex === 24) {
            offsets = { x: -20, y: -40 };
          }

          // Aplica la posición con los offsets calculados
          bodyPoint.setPosition(
            coord.x * Constants.CANVASMULTI.WIDTHMULTI + offsets.x,
            coord.y * Constants.CANVASMULTI.HEIGHTMULTI + offsets.y
          );
        } else {
          console.error("Missing coordinate or body point for index:", index);
        }
      });
    }
  }

}
