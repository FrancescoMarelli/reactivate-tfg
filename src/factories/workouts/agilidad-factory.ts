import WorkoutAgility from '~/scenes/workout-agilidad';
import { ArcadeFactory } from '~/factories/interfaces/ArcadeFactory';

export class AgilidadFactory implements ArcadeFactory {
  create() {
    let scene = new WorkoutAgility();
    scene.create();
  }
}
