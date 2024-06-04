export interface IArcadeExercise {
  markers: any[];
  intensity: number;
  bodyPoints: Phaser.Physics.Arcade.Sprite[];

  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]): void;
  setMarkers(markers: any[]): void;
  destroyMarker(marker: any, isTouched: boolean): void;
  getUntouchedMarkers() : number;
  getTouchedMarkers() : number;
  getLevel(): number;
  setIntensity(intensity: number): void;
}
