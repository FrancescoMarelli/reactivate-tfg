import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import Phaser from 'phaser';


/**
 * Esta clase abstracta con este metodo estatico sirve para poder lees por json la articulacion con la que se quiere jugar
 * sin tener que hardcodearla.
 */
export abstract class MovePoints {

  static movePoints(coords: IPoseLandmark[] | undefined, bodyPoints: Phaser.Physics.Arcade.Sprite[] | undefined, movementSettings) {
    if (!coords || !bodyPoints) {
      console.error("Coordinates or body points are missing.");
      return;
    }

    const activeIndices = movementSettings.activeJoints.map(joint => EPoseLandmark[joint as keyof typeof EPoseLandmark]);

    const offsetMap = {
      [EPoseLandmark.LeftIndex]: { x: 20, y: -40 },
      [EPoseLandmark.RightIndex]: { x: -20, y: -40 },
    };

    activeIndices.forEach((index, i) => {
      const coord = coords[index];
      const bodyPoint = bodyPoints[i];
      if (coord && bodyPoint) {
        // Calcula el índice ajustado como en el método original
        const adjustedIndex = i + 11;

        // Determina si es un caso especial
        let offsets = { x: 0, y: 0 };
        if (adjustedIndex === 23) {
          offsets = { x: 20, y: -40 };  // Ajustes para la mano izquierda
        } else if (adjustedIndex === 24) {
          offsets = { x: -20, y: -40 }; // Ajustes para la mano derecha
        } else {
          offsets = offsetMap[index] || { x: 0, y: 0 };
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
