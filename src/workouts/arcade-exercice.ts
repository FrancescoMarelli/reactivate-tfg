export interface IArcadeExercise {
  markers: any[];
  difficulty: number;
  intensity: number;

  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]): void;
  setMarkers(markers: any[]): void;
  destroyMarker(marker: any, isTouched: boolean): void;
  getUntouchedMarkers() : number;
  getTouchedMarkers() : number;
  getLevel(): number;
  setDifficulty(difficulty: number): void;
  setIntensity(intensity: number): void;
}
