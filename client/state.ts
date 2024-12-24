import {
  createNewUser,
  createPlayroom,
  enterThePlayRoom,
  existRoom,
  gameStateReset,
  getData,
  incomingPlayer,
  moveOption,
  resetAllGame,
  resetMatchGame,
  resetOnline,
  playerCreatorName,
  savePointsInDataBase,
} from './api-play-room';
import { Router } from '@vaadin/router';
import { RTDB } from './firebase-rtdb';
import { ref, onValue } from 'firebase/database';
import map from 'lodash/map';

type move = 'piedra' | 'papel' | 'tijera' | '';

const state = {
  data: {
    name: '',
    meChoice: '',
    otherChoice: '',
    otherConnection: false,
    userId: '',
    numberPlayers: {
      me: '',
      other: '',
    },
    namePlayers: {
      me: '',
      other: '',
    },
    rtdbRoomId: 0,
    keyRoom: 0,
    points: {
      me: 0,
      other: 0,
    },
    result: '',
    error: '',
    otherOnline: false,
    flagStart: false,
    meReady: true,
  },
  getData() {
    return this.data;
  },
  howWin(meMove: move, otherMove: move) {
    let meWin =
      (meMove == 'papel' && otherMove == 'piedra') ||
      (meMove == 'piedra' && otherMove == 'tijera') ||
      (meMove == 'tijera' && otherMove == 'papel');

    if (meMove == otherMove) {
      return 'tie';
    }
    if (meWin) {
      this.data.points.me++;
      return 'winner';
    }
    if (!meWin) {
      this.data.points.other++;
      return 'loser';
    }
  },
  initPoints() {
    getData(this.data.rtdbRoomId, this.data.numberPlayers.me).then((res) => {
      this.data.namePlayers.me = res.me.meName;
      this.data.namePlayers.other = res.me.otherName;
      this.data.points.me = res.me.mePoints;
      this.data.points.other = res.other.otherPoints;
    });
    resetOnline(this.data.rtdbRoomId, this.data.numberPlayers.me);
    this.resetAllMatch();
  },
  resetAllMatch() {
    resetAllGame(this.data.rtdbRoomId).then((res) => {
      Router.go('/start-game');
    });
  },
  createRoom(name: string) {
    this.data.name = name;
    this.data.numberPlayers.me = 'Player1';
    this.data.numberPlayers.other = 'Player2';
    createNewUser(name).then((newPlayer) => {
      this.data.userId = newPlayer.id;
      const userId = this.getData().userId;
      createPlayroom(userId).then((idRoom) => {
        this.data.keyRoom = parseInt(idRoom.id);
        Router.go('/code-public');
        enterThePlayRoom(this.data.userId, this.data.keyRoom).then((result) => {
          this.data.rtdbRoomId = result.rtdbRoomId;
          this.listenerChange();
          playerCreatorName(this.data.name, this.data.rtdbRoomId).then(
            (res) => {
              console.log(res);
            }
          );
        });
      });
    });
  },
  createUser(name: string, codeId: number) {
    this.data.name = name;
    this.data.keyRoom = codeId;
    this.existRoomState(codeId).then((existRoomRes) => {
      if (existRoomRes) {
        createNewUser(name).then((result) => {
          const userId = result.id;
          enterThePlayRoom(userId, codeId).then((res) => {
            this.data.rtdbRoomId = res.rtdbRoomId;
            incomingPlayer(this.data.name, this.data.rtdbRoomId).then(
              (typeOfPlayer) => {
                const userAndRoomNotMatch =
                  'this player is Undefined in this room' == typeOfPlayer;
                if (userAndRoomNotMatch) {
                  this.data.error = 'error player';
                  Router.go('/error');
                } else {
                  this.typeOfPlayers(typeOfPlayer.player);
                  this.initPoints();
                  this.listenerChange();
                }
              }
            );
          });
        });
      } else {
        this.data.error = 'error playroom';
        Router.go('/error');
      }
    });
  },
  async existRoomState(idRoom: number) {
    const promise = await existRoom(idRoom);
    if (promise == 'ok') {
      return true;
    } else {
      return false;
    }
  },
  typeOfPlayers(me: string) {
    if (me == 'Player1') {
      this.data.numberPlayers.me = 'Player1';
      this.data.numberPlayers.other = 'Player2';
    } else {
      this.data.numberPlayers.me = 'Player2';
      this.data.numberPlayers.other = 'Player1';
    }
  },
  listenerChange() {
    const currentGame = ref(
      RTDB,
      `playrooms/${this.data.rtdbRoomId}/currentGame`
    );

    onValue(currentGame, (snapshot) => {
      const data = snapshot.val();
      let player = map(data);
      const mePlayer = player[0].name == this.data.name;
      let meConnected = false;
      let meOnline = false;
      let otherConnected = false;
      let otherOnline = false;
      if (mePlayer) {
        meConnected = player[0].start;
        meOnline = player[0].online;
        otherConnected = player[1].start;
        otherOnline = player[1].online;
        this.data.meChoice = player[0].choice;
        this.data.otherChoice = player[1].choice;
        this.data.namePlayers.me = player[0].name;
        this.data.namePlayers.other = player[1].name;
      } else {
        meConnected = player[1].start;
        meOnline = player[1].online;
        otherConnected = player[0].start;
        otherOnline = player[0].online;
        this.data.meChoice = player[1].choice;
        this.data.otherChoice = player[0].choice;
        this.data.namePlayers.me = player[1].name;
        this.data.namePlayers.other = player[0].name;
      }
      const playersConnected = meConnected && otherConnected;
      const playerChoiced =
        this.data.meChoice == '' && this.data.otherChoice == '';
      const player2Login = player[1].name == '';
      if (
        !player2Login &&
        !meConnected &&
        !otherConnected &&
        state.data.meReady
      ) {
        Router.go('/start-game');
      }
      if (player2Login) {
        Router.go('/code-public');
      }
      if (playersConnected && !player2Login && playerChoiced) {
        Router.go('/game');
      }
      const twoOptionsStart =
        this.data.meChoice == '' || this.data.otherChoice == '';
      if (
        meConnected &&
        otherConnected &&
        !twoOptionsStart &&
        this.data.flagStart
      ) {
        Router.go('/show-animation');
        this.data.flagStart = false;
      }
      if (meOnline && otherOnline) {
        const rtdb = this.data.rtdbRoomId;
        const me = this.data.numberPlayers.me;
        const other = this.data.numberPlayers.other;
        resetOnline(rtdb, me);
        resetOnline(rtdb, other);
      }
    });
  },
  resetStartGame() {
    const player = this.data.numberPlayers.me;
    const roomId = this.data.rtdbRoomId;
    gameStateReset(player, roomId);
  },
  countPoints() {
    const meMove = this.data.meChoice;
    const otherMove = this.data.otherChoice;
    const result = this.howWin(meMove, otherMove);
    this.data.result = result;
  },
  setMove(move: move) {
    const rtdb = this.data.rtdbRoomId;
    const player = this.data.numberPlayers.me;
    moveOption(player, rtdb, move).then((res) => {});
  },
  resetMatch() {
    resetMatchGame(this.data.rtdbRoomId, this.data.numberPlayers.me).then(
      (res) => {}
    );
  },
  savePointsInrtdb() {
    savePointsInDataBase(
      this.data.rtdbRoomId,
      this.data.numberPlayers.me,
      this.data.points.me,
      this.data.numberPlayers.other,
      this.data.points.other
    ).then((res) => {
      console.log(res);
    });
  },
};

export { state, move };
