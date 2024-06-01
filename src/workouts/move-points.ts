import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import Phaser from 'phaser';

export abstract class MovePoints {
  static movePoints(coords: IPoseLandmark[] | undefined, bodyPoints: Phaser.Physics.Arcade.Sprite[] | undefined, movementSettings: any) {
    if (bodyPoints && coords) {
      // Mapeo de índices activos según el EPoseLandmark
      const activeIndices = movementSettings.activeJoints.map((joint: string) => EPoseLandmark[joint as keyof typeof EPoseLandmark]);

      bodyPoints.forEach((bodyPoint, i) => {
        let index = activeIndices[i];
        let coord = coords?.[index];

        if (!coord) {
          console.error("Missing coordinate for index:", index);
          return;
        }

        // Determina si hay offsets especiales para este índice
        let offsets = { x: 0, y: 0 };
        if (movementSettings.specialOffsets && movementSettings.specialOffsets[index]) {
          offsets = movementSettings.specialOffsets[index];
        }

        // Aplica la posición con los offsets calculados
        bodyPoint.setPosition(
          coord.x * Constants.CANVASMULTI.WIDTHMULTI + offsets.x,
          coord.y * Constants.CANVASMULTI.HEIGHTMULTI + offsets.y
        );
      });
    }
  }

  static movePointsAgilidad(coords: IPoseLandmark[] | undefined, bodyPoints: Phaser.Physics.Arcade.Sprite[] | undefined) {
    if (bodyPoints && coords) {
      for (let i = 0; i < bodyPoints.length; i++) {
        if (i == 34) { // To extend hands points (improve accuracy)
          bodyPoints[i]?.setPosition(coords[19]?.x * 1280 + 20, coords[19]?.y * 720 - 40);
        } else if (i == 35) {
          bodyPoints[i]?.setPosition(coords[20]?.x * 1280 - 20, coords[20]?.y * 720 - 40);
        } else {
          bodyPoints[i]?.setPosition(coords[i]?.x * 1280, coords[i]?.y * 720);
        }
      }
    }
  }
}
