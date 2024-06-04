import Constants from '~/constants';
import WebFontFile from '~/WebFontFile';

export default class Loader extends Phaser.Scene {
  private loadBar: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private textLoading: Phaser.GameObjects.Text;
  private width: number;
  private height: number;

  constructor() {
    super(Constants.SCENES.LOADER);
  }

  preload(): void {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
    this.load.path = 'assets/';
    this.cameras.main.setBackgroundColor(0x000000);
    this.buildBar();

    const fonts = new WebFontFile(this.load, 'Russo One');
    this.load.addFile(fonts);


    this.textLoading = this.add.text(this.width / 2 - 120, this.height / 2 - 120, 'Cargando ...', {
      fontFamily: 'Russo One',
      fontSize: '45px',
      color: '#FFFFFF',
      fontStyle: 'normal',
    });

    //Listener mientras se cargan los assets
    this.load.on(
      'progress',
      (value: number) => {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x125555, 1);
        this.progressBar.fillRect(
          this.width / 4,
          this.height / 2 - 16,
          (this.width / 2) * value,
          16,
        );
      },
      this,
    );
    this.load.on(
      'complete',
      () => {
        this.scene.start(Constants.SCENES.Menu);
      },
      this,

    );

    this.load.image('point', 'img/point.png');
    this.load.image('rightHand', 'img/rightHand.png');
    this.load.image('leftHand', 'img/leftHand.png');
    this.load.image('hud', 'img/hud.png');
    this.load.image('out', 'img/out.png');
    this.load.image('silhouette', 'img/blueSilhouette.png');
    this.load.image('button', 'img/button.png');
    this.load.image('getReady', 'img/out.png');

    this.load.image('blueFuture', 'img/markers/blueFuture.png');
    this.load.image('redFuture', 'img/markers/redFuture.png');
    this.load.image('blueBall', 'img/markers/blueBall.png');
    this.load.image('errorBall', 'img/markers/errorBall.png');
    this.load.image('blueAnime', 'img/markers/blueAnime.png');
    this.load.image('redAnime', 'img/markers/redAnime.png');
    this.load.image('medievalBlue', 'img/markers/blueMedieval.png');
    this.load.image('medievalRed', 'img/markers/medievalRed.png');

    this.load.image('triangle', 'img/markers/triangle.png');
    this.load.image('redTriangle', 'img/markers/redTriangle.png');
    this.load.image('japBlue', 'img/markers/japBlueTriangle.png');
    this.load.image('japRed', 'img/markers/japRedTriangle.png');
    this.load.image('medievalBlueTriangle', 'img/markers/medievalBlueTriangle.png');
    this.load.image('medievalRedTriangle', 'img/markers/medievalRedTriangle.png');
    this.load.image('blueFutureTriangle', 'img/markers/blueFutureTriangle.png');
    this.load.image('redFutureTriangle', 'img/markers/redFutureTriangle.png');


    this.load.image('marker', 'img/markers/marker.png');
    this.load.image('transparentMarker', 'img/markers/transparentMarker.png');

    this.load.image('backgroundStats', 'img/backgroundStats.png');
    this.load.image('room', 'img/room.png');
    this.load.image('meteorite', 'img/meteorite.png');
    this.load.image('particle-red', 'particles/particle-red.png');
    this.load.image('particle-orange', 'particles/particle-orange.png');
    this.load.image('particle-blue', 'particles/particle-blue.png');
    this.load.image('firework', 'img/fireworks.gif');
    this.load.image('gameover', 'img/gameover.gif');
    this.load.image('particle-green', 'particles/particle-green.png');

    this.load.image('background', 'img/background.png');
    this.load.image('up', 'img/uppushup.png');
    this.load.image('down', 'img/downpushup.png');

    this.load.bitmapFont('gothic', 'fonts/bitmap/gothic.png', 'fonts/bitmap/gothic.xml');

    // MUSIC, EFFECTS %% VIDEOS
    this.load.audio('trance', 'audio/trance.mp3');
    this.load.audio('trance2', 'audio/trance2.mp3');
    this.load.audio('trance3', 'audio/trance3.mp3');

    this.load.audio('sky', 'audio/sky.mp3');
    this.load.audio('Futuro', 'audio/futuristic.mp3');
    this.load.audio('Medieval', 'audio/medieval.mp3');
    this.load.audio('Japon', 'audio/japanese.mp3');
    this.load.audio('Default', 'audio/sky.mp3');

    this.load.audio('sfxDestroyMarkerTouched', 'audio/soundAnimation.mp3');
    this.load.audio('sfxDestroyMarkerUntouched', 'audio/sfxDestroyMarkerUntouched.wav');
    this.load.audio('contactError', 'audio/contactError.wav');
    this.load.audio('cardio', 'audio/cardio.wav');
    this.load.audio('agility', 'audio/agilidad.wav');
    this.load.audio('flexibility', 'audio/flexibilidad.wav');
    this.load.audio('mitad', 'audio/mitad.wav');
    this.load.audio('fallos', 'audio/fallos.wav');
    this.load.audio('ritmo', 'audio/ritmo.wav');
    this.load.audio('posicion', 'audio/posicion.wav');
    this.load.audio('vamos', 'audio/posicion.wav');
    this.load.audio('audioTutorial', 'audio/tutorial.mp3');
    this.load.audio('faster', 'audio/faster.mp3');
    this.load.audio('goon', 'audio/goon.mp3');
    this.load.audio('welldone', 'audio/welldone.mp3');
    this.load.video('tutorial','img/tutorial.mp4','tutorial',false, true)

    this.load.image('japanGif', 'img/gif/samurai.gif');
    this.load.image('defaultGif', 'img/gif/default.gif');
    this.load.image('medievalGif', 'img/gif/elf.gif');
    this.load.image('futureGif', 'img/gif/robot.gif');
    this.load.image('cloud', 'img/gif/cloud.png');
  }

  /**
   * For creating progress bars
   */
  private buildBar(): void {
    this.loadBar = this.add.graphics();
    this.loadBar.fillStyle(0xffffff, 1);
    this.loadBar.fillRect(
      this.width / 4 - 2,
      this.height / 2 - 18,
      this.width / 2 + 4,
      20,
    );
    this.progressBar = this.add.graphics();
  }
}
