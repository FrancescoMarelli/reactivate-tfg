export interface IArcadeExercise {
  markers: any[];
  setBodyPoints(bodyPoints: Phaser.Physics.Arcade.Sprite[]): void;
  setMarkers(markers: any[]): void;
  destroyMarker(marker: any, isTouched: boolean): void;
}
