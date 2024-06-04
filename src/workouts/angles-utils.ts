export abstract class AnglesUtils {
  static calculateAngle(p1,p2, p3) {
    if (!p1 || !p2 || !p3) {
      return 0;
    }

    const dx1 = p1.x - p2.x;
    const dy1 = p1.y - p2.y;
    const dx2 = p3.x - p2.x;
    const dy2 = p3.y - p2.y;

    const angle = Math.atan2(dy1 * dx2 - dx1 * dy2, dx1 * dx2 + dy1 * dy2);

    return Math.abs(angle * (180 / Math.PI));
  }
}
