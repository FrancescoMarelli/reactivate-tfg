import { IPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.interface';
import { EPoseLandmark } from '~/pose-tracker-engine/types/pose-landmark.enum';
import Constants from '~/constants';
import Phaser from 'phaser';

export abstract class MovePoints {
  static movePoints(coords: IPoseLandmark[] | undefined, bodyPoints: Phaser.Physics.Arcade.Sprite[] | undefined, movementSettings: any) {
    coords = coords?.map((coord) => coord ?? {x: 0, y: 0, z: 0, visibility: 0});
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

        // Aplica la posición con los offsets calculados
        bodyPoint.setPosition(
          coord.x * Constants.CANVASMULTI.WIDTHMULTI,
          coord.y * Constants.CANVASMULTI.HEIGHTMULTI
        );
      });
    }
  }
}
