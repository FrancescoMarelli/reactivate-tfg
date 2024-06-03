import Phaser from 'phaser';

export interface IThemeFactory {
  create(theme: string): string;
}
