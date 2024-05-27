const Constants = {
  EVENT: {
    UPDATEEXP: 'updateExp',
    CLOCK: 'clock',
    STOPAUDIOINIT: 'stopAudioInit',
    COUNTER: 'updateCounter',
    UPDATE_HALF: 'updateHalf',
  },
  REGISTER: {
    EXP: 'exp',
    CLOCK: 'clock',
    LEVEL: 'level',
    COUNTER: 'contador'
  },
  SCENES: {
    CONFIG: 'GameConfig',
    LOADER: 'Loader',
    Menu: 'Menu',
    WorkoutCardio: 'WorkoutCardio',
    WorkoutAgilidad: 'WorkoutAgilidad',
    WorkoutFlexibilidad: 'WorkoutFlexibilidad',
    HUD: 'HUD',
    STATS: 'STATS',
    GAME_CREATOR: 'GameScene',
    GAME: 'Gym',
    ARCADE: 'Arcade',
    PUSHUPS: 'PushUps',
    JUMPINGJACKS: 'JumpingJacks',
    WEIGTHLIFTING: 'WeigthLifting'
  },
  MARKER: {
    ID: 'marker',
    ANIMATION: {
      WAIT: 'idle',
      TOUCHED: 'touched',
    },
  },
  TRANSPARENTMARKER: {
    ID: 'transparentMarker',
    ANIMATION: {
      WAIT: 'idle',
      TOUCHED: 'touched',
    },
  },
  AUDIO: {
    TRANCE: 'trance',
    DURATIONTRANCE:'03:56',
    TRANCE2: 'trance2',
    DURATIONTRANCE2:'04:54',
    TRANCE3: 'trance3',
    DURATIONTRANCE3:'03:33',
    DESTROYTOUCHED: 'sfxDestroyMarkerTouched',
    DESTROYUNTOUCHED: 'sfxDestroyMarkerUntouched',
    CONTACTERROR: 'contactError',
    CARDIO: 'cardio',
    AGILITY: 'agility',
    FLEXIBILITY: 'flexibility',
    HALF: 'mitad',
    FAULTS: 'fallos',
    RHYTHM: 'ritmo',
    POSITION: 'posicion',
    GO: 'vamos',
    AUDIOTUTORIAL: 'audioTutorial'
  },
  DATA: {
    RANKING: 'ranking',
    STATS: 'stats'
  },
  CANVASMULTI: {
    WIDTHMULTI: 1280,
    HEIGHTMULTI: 720
  }
};

export default Constants;
