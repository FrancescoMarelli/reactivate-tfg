import { IThemeFactory } from '~/factories/interfaces/theme-factory.interface';

export default class ThemeFactory implements IThemeFactory {
  create(theme: string): string {
    return theme;
  }
}
