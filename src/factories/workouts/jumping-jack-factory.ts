import { IPoseTrackerResults } from '~/pose-tracker-engine/types/pose-tracker-results.interface';
import { JumpinJackDetector } from '~/workouts/jumpin-jack-detector';
import { IMovementFactory } from '~/factories/interfaces/movement-factory.interface';
import Constants from '~/constants';

class JumpingJackFactory implements IMovementFactory {
  create(scene: Phaser.Scene, config: any): void {
    const jumpingJackDetector = new JumpinJackDetector(scene, config.bottomAngle, config.topAngle);

    scene.events.on('POSE_UPDATE', (poseResults: IPoseTrackerResults) => {
      jumpingJackDetector.update(poseResults);
    });

    scene.events.on(Constants.EVENT.COUNTER, () => {
      console.log(`Jumping Jack counter: ${jumpingJackDetector.getCounter()}`);
    });
  }
}
