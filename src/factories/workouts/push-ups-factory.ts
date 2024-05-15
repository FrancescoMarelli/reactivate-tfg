import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { PushUps } from '~/workouts/push-ups';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Constants from '~/constants';

class PushUpsFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): void {
    const pushUps = new PushUps(scene);

    scene.events.on('POSE_UPDATE', (poseResults: IPoseTrackerResults) => {
      pushUps.update(poseResults);
    });

    scene.events.on(Constants.EVENT.COUNTER, () => {
      console.log(`Push-ups counter: ${pushUps.getCounter()}`);
    });
  }
}
