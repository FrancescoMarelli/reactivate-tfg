import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { JumpinJackDetector } from '~/workouts/jumpin-jack-detector';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Constants from '~/constants';
import { WeigthLifting } from '~/workouts/weigth-lifting';

class WeightLiftinFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): void {
    const gymDetector = new WeigthLifting(scene, config.topAngle, config.bottomAngle);

    scene.events.on('POSE_UPDATE', (poseResults: IPoseTrackerResults) => {
      gymDetector.update(poseResults);
    });

    scene.events.on(Constants.EVENT.COUNTER, () => {
      console.log(`Jumping Jack counter: ${gymDetector.getCounter()}`);
    });
  }
}
