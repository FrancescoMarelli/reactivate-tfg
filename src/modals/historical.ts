import Utils from '~/utils';
import Constants from '~/constants';

export default class Historical extends Phaser.GameObjects.Image {
  private TitleTxt: Phaser.GameObjects.Text;
  private bodyTxt: Phaser.GameObjects.Text;
  private background;
  private mywidth: number;
  private myheight: number;
  private myStats: [];
  private actualStatGroup = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.mywidth = x;
    this.myheight = y;

    this.background = this.scene.add.image(this.mywidth, this.myheight + 20, texture);
    this.background.setScale(1, 1.05);

    this.TitleTxt = this.scene.add.text(this.mywidth / 4, this.myheight / 4, 'Historial', {
      fontFamily: 'Russo One',
      fontSize: '40px',
      color: '#FFFFFF',
      fontStyle: 'normal',
    });

    this.myStats = Utils.getLocalStorageByDate();
    if (this.myStats?.length) {
      this.showHistorical();
    } else {
      this.bodyTxt = this.scene.add.text(this.mywidth / 4, this.myheight / 2, "Aún no has realizado ningún entrenamiento", {
        fontFamily: 'Russo One',
        fontSize: '25px',
        color: '#FFFFFF',
        fontStyle: 'normal',
      });
    }
  }

  showHistorical(next?: boolean) {
    if (next == true && this.actualStatGroup < (this.myStats.length - 3)) {
      this.actualStatGroup = this.actualStatGroup + 3;
    } else if (next == false && this.actualStatGroup > 0) {
      this.actualStatGroup = this.actualStatGroup - 3;
    }
    if (this.bodyTxt) {
      this.bodyTxt.destroy();
    }

    var content: string[] = [];
      for (var i = this.actualStatGroup; i < this.myStats.length && (i - this.actualStatGroup) < 3; i++) {
        // Condicional para agregar diferente contenido dependiendo del tipo de entrenamiento
        if (![Constants.TRAINING.FLEXIONES,
          Constants.TRAINING.SALTOSDETIJERA,
          Constants.TRAINING.PESAS].includes(this.myStats[i]["_workout"])) {
          content.push(
            "Tipo de entrenamiento: " + this.myStats[i]["_workout"],
            "Fecha del entrenamiento: " + this.myStats[i]["_date"],
            "Máximo nivel alcanzado: " + this.myStats[i]["_maxLevel"],
            "Marcadores alcanzados: " + this.myStats[i]["_touchedMarkers"],
            "Marcadores no alcanzados: " + this.myStats[i]["_untouchedMarkers"]
          );
        } else {
          content.push(
            "Tipo de entrenamiento: " + this.myStats[i]["_workout"],
            "Fecha del entrenamiento: " + this.myStats[i]["_date"],
            "Nivel del entrenamiento: " + this.myStats[i]["_maxLevel"],
            "Repeticiones realizadas: " + this.myStats[i]["_touchedMarkers"]
          );
        }
        content.push(""); // Añade una línea vacía entre cada grupo de estadísticas
      }

    this.bodyTxt = this.scene.add.text(this.mywidth / 4, this.myheight / 2 - 20, content, {
      fontFamily: 'Russo One',
      fontSize: '25px',
      color: '#FFFFFF',
      fontStyle: 'normal',
    });
  }

  destroyHistorical() {
    this.background.destroy();
    this.TitleTxt.destroy();
    if (this.bodyTxt) {
      this.bodyTxt.destroy();
    }
  }
}
