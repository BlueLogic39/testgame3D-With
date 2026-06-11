import * as THREE from "./three.module.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { FBXLoader } from "./FBXLoader.js";

const canvas = document.getElementById("game");
const ui = {
  level: document.getElementById("level"),
  hp: document.getElementById("hp"),
  time: document.getElementById("time"),
  kills: document.getElementById("kills"),
  skillText: document.getElementById("skillText"),
  skillFill: document.getElementById("skillFill"),
  skillReadyHint: document.getElementById("skillReadyHint"),
  xpFill: document.getElementById("xpFill"),
  build: document.getElementById("build"),
  start: document.getElementById("start"),
  startButton: document.getElementById("startButton"),
  stageSelectPanel: document.getElementById("stageSelectPanel"),
  stageStartButton: document.getElementById("stageStartButton"),
  backFromStageButton: document.getElementById("backFromStageButton"),
  openCreateRoomButton: document.getElementById("openCreateRoomButton"),
  openJoinRoomButton: document.getElementById("openJoinRoomButton"),
  characterSelect: document.getElementById("characterSelect"),
  stageSelect: document.getElementById("stageSelect"),
  difficultySelect: document.getElementById("difficultySelect"),
  createRoomPanel: document.getElementById("createRoomPanel"),
  roomStageSelect: document.getElementById("roomStageSelect"),
  roomDifficultySelect: document.getElementById("roomDifficultySelect"),
  joinRoomPanel: document.getElementById("joinRoomPanel"),
  backFromCreateButton: document.getElementById("backFromCreateButton"),
  backFromJoinButton: document.getElementById("backFromJoinButton"),
  hostButton: document.getElementById("hostButton"),
  playerName: document.getElementById("playerName"),
  roomNameInput: document.getElementById("roomNameInput"),
  roomPasswordInput: document.getElementById("roomPasswordInput"),
  roomList: document.getElementById("roomList"),
  joinPasswordPanel: document.getElementById("joinPasswordPanel"),
  joinPasswordLabel: document.getElementById("joinPasswordLabel"),
  joinPasswordInput: document.getElementById("joinPasswordInput"),
  confirmJoinButton: document.getElementById("confirmJoinButton"),
  roomStatus: document.getElementById("roomStatus"),
  lobby: document.getElementById("lobby"),
  lobbyCode: document.getElementById("lobbyCode"),
  lobbyPlayers: document.getElementById("lobbyPlayers"),
  lobbyStartButton: document.getElementById("lobbyStartButton"),
  leaveRoomButton: document.getElementById("leaveRoomButton"),
  lobbyStatus: document.getElementById("lobbyStatus"),
  toast: document.getElementById("toast"),
  skillBanner: document.getElementById("skillBanner"),
  skillBannerName: document.getElementById("skillBannerName"),
  skillBannerPlayer: document.getElementById("skillBannerPlayer"),
  radialMenu: document.getElementById("radialMenu"),
  onlineBadge: document.getElementById("onlineBadge"),
  updateButton: document.getElementById("updateButton"),
  updateInfo: document.getElementById("updateInfo"),
  closeUpdateButton: document.getElementById("closeUpdateButton"),
  settingsButton: document.getElementById("settingsButton"),
  settingsPanel: document.getElementById("settingsPanel"),
  masterVolume: document.getElementById("masterVolume"),
  bgmVolume: document.getElementById("bgmVolume"),
  seVolume: document.getElementById("seVolume"),
  masterVolumeText: document.getElementById("masterVolumeText"),
  bgmVolumeText: document.getElementById("bgmVolumeText"),
  seVolumeText: document.getElementById("seVolumeText"),
  codexButton: document.getElementById("codexButton"),
  moneyBadge: document.getElementById("moneyBadge"),
  shopButton: document.getElementById("shopButton"),
  shopPanel: document.getElementById("shopPanel"),
  shopMoney: document.getElementById("shopMoney"),
  shopItems: document.getElementById("shopItems"),
  closeShopButton: document.getElementById("closeShopButton"),
  characterCodex: document.getElementById("characterCodex"),
  closeCodexButton: document.getElementById("closeCodexButton"),
  codexCanvas: document.getElementById("codexCanvas"),
  codexCards: document.getElementById("codexCards"),
  codexModelToggle: document.getElementById("codexModelToggle"),
  codexName: document.getElementById("codexName"),
  codexRole: document.getElementById("codexRole"),
  codexWeapon: document.getElementById("codexWeapon"),
  codexPassive: document.getElementById("codexPassive"),
  codexSkill: document.getElementById("codexSkill"),
  codexUpgrades: document.getElementById("codexUpgrades"),
  statusOverlay: document.getElementById("statusOverlay"),
  statusTitle: document.getElementById("statusTitle"),
  statusText: document.getElementById("statusText"),
  pauseTitleButton: document.getElementById("pauseTitleButton"),
  levelUp: document.getElementById("levelUp"),
  choices: document.getElementById("choices"),
  gameOver: document.getElementById("gameOver"),
  endTitle: document.getElementById("endTitle"),
  endText: document.getElementById("endText"),
  voteText: document.getElementById("voteText"),
  restartButton: document.getElementById("restartButton"),
  disbandButton: document.getElementById("disbandButton"),
};

const WORLD = { half: 34 };
const keys = new Set();
let debugSkillPresses = [];
let debugBossPresses = { mid: [], boss: [] };
const aim = new THREE.Vector3(0, 0, -8);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerOnCanvas = false;
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

let scene;
let camera;
let renderer;
let arenaFloor;
let arenaGrid;
let arenaWalls = [];
let stageDecor = null;
let state;
let lastTime = 0;
let animationId = 0;
let localPlayerId = "host";
let spectateIndex = 0;
let radialActive = false;
let radialChoice = "Hello!";
let selectedRoomKey = "";
let selectedOnlineRoom = null;
let selectedCharacterId = "archer";
let selectedStageId = "stage1";
let selectedDifficultyId = "normal";
let stage3DebugUnlocked = false;
let debugStage3Presses = [];
let debugMoneySequence = [];
let presenceClientId = getPresenceClientId();
let presenceHeartbeatTimer = 0;
let presenceCountTimer = 0;
let presenceCleanupTimer = 0;
let onlinePresenceCount = 1;
let onlineBadgeLoading = false;
let progress = loadProgress();
let net = {
  mode: "solo",
  phase: "menu",
  peer: null,
  conn: null,
  clients: new Map(),
  lobbyPlayers: [],
  roomCode: "",
  roomName: "",
  roomPassword: "",
  roomOwnerToken: "",
  stageId: "stage1",
  difficultyId: "normal",
  pausedBy: null,
  waitingFor: null,
  lastSend: 0,
  restartVotes: new Set(),
};
let lobbyHeartbeatTimer = 0;
let codexViewer = null;
let audio = {
  bgm: null,
  bgmFile: "",
  bgmTimer: 0,
  bgmLoopGap: 0,
  sounds: {},
  activeSounds: new Set(),
  loaded: false,
  enabled: true,
  masterVolume: 0.3,
  bgmVolume: 0.1,
  seVolume: 0.15,
};

const AUDIO_FILES = {
  archerAttack: "arrowsound.mp3",
  archerSkill: "arrowskillsound.mp3",
  witchAttack: "witchmagicsound.mp3",
  witchSkill: "witchskillsound.mp3",
  witchIceSpike: "witchicespikesound.mp3",
  saberAttack: "swordsound.mp3",
  saberSkill: "swordskillsound.mp3",
  victory: "victory.mp3",
  gameover: "gameover.mp3",
  start: "gamestartsound.mp3",
  gemA: "keikenti.mp3",
  gemB: "keikenti1.mp3",
  heal: "kaihuku.mp3",
  thunderA: "kaminari1.mp3",
  thunderB: "kaminari2.mp3",
  bomber: "bomber.mp3",
  rockA: "rock1.mp3",
  rockB: "rock2.mp3",
};

const SUPABASE_URL = "https://oeizknymvzmokzxksidg.supabase.co";
const SUPABASE_KEY = "sb_publishable_dGQHfQBP0GXAv1ILQXn3lA_I_SSPrcz";
const ONLINE_ROOM_TTL_SECONDS = 45;
const PROGRESS_KEY = "vansabaProgress";
const UPGRADE_MAX_LEVEL = 5;

const SHOP_ITEMS = [
  { id: "power", type: "permanent", name: "筋力訓練", desc: "全キャラの攻撃力がレベルごとに+5%。", baseCost: 120, costStep: 80, max: 5 },
  { id: "vitality", type: "permanent", name: "体力訓練", desc: "全キャラの最大HPがレベルごとに+10。", baseCost: 110, costStep: 75, max: 5 },
  { id: "speed", type: "permanent", name: "俊足訓練", desc: "全キャラの移動速度がレベルごとに+3%。", baseCost: 130, costStep: 90, max: 5 },
  { id: "magnet", type: "permanent", name: "磁力強化", desc: "経験値を吸い寄せる範囲がレベルごとに+8%。", baseCost: 100, costStep: 70, max: 5 },
  { id: "witch", type: "character", name: "ウィッチ購入", desc: "元素魔法を操るウィッチを使用可能にする。", cost: 300 },
  { id: "saber", type: "character", name: "セイバー購入", desc: "近距離を薙ぎ払うセイバーを使用可能にする。", cost: 500 },
  { id: "stage2", type: "stage", name: "黒晶鉱山 解放", desc: "ステージ2を選択可能にする。", cost: 700 },
];

const CHARACTER_TYPES = {
  archer: { label: "アーチャー", color: 0x57c4a7, remoteColor: 0x5aa7ff },
  witch: { label: "ウィッチ", color: 0x8b5cf6, remoteColor: 0xb07cff },
  saber: { label: "セイバー", color: 0xd9dfe8, remoteColor: 0x91c7ff },
  ninja: { label: "忍者", color: 0x2dd4bf, remoteColor: 0x67e8f9 },
};

const STAGES = {
  stage1: { label: "迷いの森", description: "木々に囲まれた森の3分ステージ", duration: 180, bossTime: 150, midBossTimes: [90] },
  stage2: { label: "黒晶鉱山", description: "落石が敵も味方も巻き込む6分ステージ", duration: 360, bossTime: 330, midBossTimes: [120, 240], rockfalls: true, bomberEnemies: true },
  stage3: { label: "冥冠城塞", description: "城壁に囲まれた10分ステージ", duration: 600, bossTime: 570, midBossTimes: [150, 300, 450], castle: true },
};

const DIFFICULTIES = {
  easy: { label: "イージー", description: "青い敵・中ボスなし", shooterEnemies: false, midBosses: false },
  normal: { label: "ノーマル", description: "通常ルール", shooterEnemies: true },
};

const CHARACTER_MODELS = {
  archer: { path: "./model_glTF/Elf.gltf", scale: 0.72, keepProps: true },
  witch: { path: "./model_glTF/Witch.gltf", scale: 0.68, keepProps: true },
  saber: { path: "./model_glTF/Knight_Male.gltf", scale: 0.78, keepProps: true },
  ninja: { path: "./model_glTF/Ninja_Male.gltf", scale: 0.78, keepProps: true },
};

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
const fbxModelCache = new Map();

const FBX_ASSETS = {
  bow: { path: "./model_FBX/Bow_Wooden.fbx", size: 1.18, position: [-0.34, 1.26, 0.08], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
  arrow: { path: "./model_FBX/Arrow.fbx", size: 1.85, position: [0, 0, 0], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
  staff: { path: "./model_FBX/WoodenStaff.fbx", size: 1.62, position: [0.58, 0.9, 0.08], rotation: [0, 0, -0.24], scale: [1, 1, 1] },
  sword: { path: "./model_FBX/Sword.fbx", size: 1.45, position: [0.56, 0.76, 0.02], rotation: [0, 0, -0.62], scale: [1, 1, 1] },
  heart: { path: "./model_FBX/Heart.fbx", size: 0.92, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  castleWall: { path: "./model_FBX/Castle/TallWall.fbx", size: 8.2, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1.32, 1.06, 1], groundOffset: 0 },
  castleWallBricks: { path: "./model_FBX/Castle/TallWallBricks.fbx", size: 8.2, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1.32, 1.06, 1], groundOffset: 0 },
  castleWallEntrance: { path: "./model_FBX/Castle/TallWallEntrance.fbx", size: 8.8, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1.18, 1.04, 1], groundOffset: 0 },
  castleTower: { path: "./model_FBX/Castle/Tower.fbx", size: 8.5, position: [0, 4.25, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  castlePointyTower: { path: "./model_FBX/Castle/PointyTower.fbx", size: 9.4, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], groundOffset: -0.12 },
  castleWatchtower: { path: "./model_FBX/Castle/WatchTowerWRoof.fbx", size: 8.2, position: [0, 4.1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  castleBridge: { path: "./model_FBX/Castle/Bridge.fbx", size: 5.1, position: [0, 0.34, 0], rotation: [0, 0, 0], scale: [1.15, 1, 1] },
  castleBanner: { path: "./model_FBX/Castle/Banner.fbx", size: 2.7, position: [0, 1.35, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  castleWell: { path: "./model_FBX/Castle/Well.fbx", size: 3.4, position: [0, 1.7, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  castleTarget: { path: "./model_FBX/Castle/TargetWithArrows.fbx", size: 2.4, position: [0, 1.2, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  knightBossBody: { path: "./model_FBX/KNIGHT/KnightCharacter.fbx", size: 3.1, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], groundOffset: 0 },
  knightBossHelmet: { path: "./model_FBX/KNIGHT/Helmet3.fbx", size: 0.78, position: [0, 2.68, 0.03], rotation: [0, 0, 0], scale: [1, 1, 1] },
  knightBossShoulders: { path: "./model_FBX/KNIGHT/ShoulderPads.fbx", size: 1.15, position: [0, 2.08, 0.02], rotation: [0, 0, 0], scale: [1, 1, 1] },
  knightBossSword: { path: "./model_FBX/KNIGHT/Sword.fbx", size: 1.35, position: [0.95, 1.2, 0.2], rotation: [0, 0, -0.55], scale: [1, 1, 1] },
};

const CHARACTER_CODEX = [
  {
    id: "archer",
    role: "扱いやすい遠距離アタッカー",
    weapon: "マウス方向へ矢を連射します。矢の本数、貫通、バックショットで攻撃方向を広げられます。",
    passive: "追い風: 遠くの敵に矢を当てるほどダメージが上がります。距離8以上で+20%、距離14以上で+40%。",
    skill: "アローレイン: スペースキーで前方へ大量の矢を一気に放ちます。",
    upgrades: ["矢の本数 +1", "貫通 +1", "バックショット"],
  },
  {
    id: "witch",
    role: "元素魔法を操る範囲アタッカー",
    weapon: "火炎弾のファイアを放ちます。弾速は控えめですが、命中時に周囲を巻き込みます。",
    passive: "魔力爆発: ファイアが命中すると範囲ダメージが発生します。ファイア巨大化を取るほど範囲、威力、連鎖回数が伸びます。",
    skill: "魔女の大爆発: スペースキーで周囲を大きく爆発させます。",
    upgrades: ["アイススパイク", "サンダーストーム", "ファイア巨大化"],
  },
  {
    id: "saber",
    role: "近距離の前方制圧キャラクター",
    weapon: "2秒ごとにマウス方向へ90度の剣閃で薙ぎ払います。",
    passive: "バーサーカー: レベルが上がるたびに攻撃速度が10%上がります。",
    skill: "回転突進斬り: スペースキーで2秒間回転斬りしながらマウス方向へ突進します。",
    upgrades: ["剣閃範囲 +10度", "飛燕斬", "二連斬り"],
  },
];

const materials = {
  player: new THREE.MeshStandardMaterial({ color: 0x57c4a7, roughness: 0.55 }),
  remotePlayer: new THREE.MeshStandardMaterial({ color: 0x5aa7ff, roughness: 0.55 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xf0c6a0, roughness: 0.7 }),
  witchHat: new THREE.MeshStandardMaterial({ color: 0x2a123d, roughness: 0.68, emissive: 0x13051f }),
  saberBlade: new THREE.MeshStandardMaterial({ color: 0xdfe8f3, roughness: 0.24, metalness: 0.55 }),
  enemy: new THREE.MeshStandardMaterial({ color: 0xd95f59, roughness: 0.7 }),
  shooter: new THREE.MeshStandardMaterial({ color: 0x3fb7d6, roughness: 0.6, emissive: 0x06232d }),
  bomber: new THREE.MeshStandardMaterial({ color: 0xffd84a, roughness: 0.58, emissive: 0x4f3900 }),
  midBoss: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.62, emissive: 0x451a03 }),
  boss: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.6, emissive: 0x1b0f38 }),
  arrow: new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.28, metalness: 0.15 }),
  magic: new THREE.MeshStandardMaterial({ color: 0xff6b2c, roughness: 0.28, emissive: 0x7a1b05 }),
  shuriken: new THREE.MeshStandardMaterial({ color: 0xc8f3ff, roughness: 0.22, metalness: 0.6, emissive: 0x123047 }),
  ninjaShadow: new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.52, depthWrite: false }),
  ice: new THREE.MeshStandardMaterial({ color: 0x9fe8ff, roughness: 0.18, metalness: 0.05, emissive: 0x124b68, transparent: true, opacity: 0.9 }),
  bullet: new THREE.MeshStandardMaterial({ color: 0xff7a42, roughness: 0.35, emissive: 0x3a1206 }),
  gem: new THREE.MeshStandardMaterial({ color: 0x58d5b7, roughness: 0.2, emissive: 0x0d4739 }),
  shooterGem: new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.2, emissive: 0x082c62 }),
  bomberGem: new THREE.MeshStandardMaterial({ color: 0xffd84a, roughness: 0.18, emissive: 0x6b4b00 }),
  bossGem: new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.18, emissive: 0x6d0505 }),
  heart: new THREE.MeshStandardMaterial({ color: 0xff4f7b, roughness: 0.35, emissive: 0x4a0618 }),
  ring: new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.75 }),
  crystal: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.25, metalness: 0.08, emissive: 0x164e63 }),
  violetCrystal: new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.25, metalness: 0.08, emissive: 0x312e81 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x6b6259, roughness: 0.92 }),
  bark: new THREE.MeshStandardMaterial({ color: 0x5a3b24, roughness: 0.88 }),
  mineWood: new THREE.MeshStandardMaterial({ color: 0x4a2f1e, roughness: 0.9 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.94 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x2f7d45, roughness: 0.74 }),
  darkLeaves: new THREE.MeshStandardMaterial({ color: 0x1f5b38, roughness: 0.8 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x3f8f4f, roughness: 0.82 }),
  rockWarning: new THREE.MeshBasicMaterial({ color: 0xff5f5f, transparent: true, opacity: 0.34, depthWrite: false }),
  bossWarning: new THREE.MeshBasicMaterial({ color: 0xff3b66, transparent: true, opacity: 0.3, depthWrite: false }),
};

const upgrades = [
  { name: "矢の本数 +1", desc: "一度に放つ矢が増える。近距離の制圧力が上がる。", apply: (p) => (p.arrows += 1) },
  { name: "攻撃速度 +18%", desc: "攻撃間隔が短くなる。迷ったらこれ。", apply: (p) => addAttackSpeed(p, 0.18) },
  { name: "ダメージ +25%", desc: "通常攻撃の威力が増える。硬い敵に効きやすい。", apply: (p) => (p.damage *= 1.25) },
  { name: "貫通 +1", desc: "矢が追加で敵を貫く。群れに強い。", apply: (p) => (p.pierce += 1) },
  { name: "移動速度 +15%", desc: "囲まれにくくなり、経験値回収もしやすくなる。", apply: (p) => (p.speed *= 1.15) },
  { name: "最大HP +25", desc: "最大HPが増え、少し回復する。", apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { name: "吸血", desc: "敵を倒すたびにHPを少し回復する。", apply: (p) => (p.lifeSteal += 1.2) },
  { name: "バックショット", desc: "通常攻撃と同時にマウス方向の逆へ矢を撃つ。複数取ると後方矢が増える。", apply: (p) => (p.backShots += 1) },
  { name: "磁力 +40%", desc: "経験値を吸い寄せる範囲が広がる。", apply: (p) => (p.magnet *= 1.4) },
];

upgrades[0].classes = ["archer"];
upgrades[3].classes = ["archer"];
upgrades[7].classes = ["archer"];
upgrades.push(
  { name: "アイススパイク", desc: "一定間隔で近くの敵の足元から氷柱を出す。取得するたび氷柱+2、スロー時間+1秒、威力が少し伸びる。", classes: ["witch"], apply: (p) => (p.iceSpike += 1) },
  { name: "サンダーストーム", desc: "自分の周辺に雷の魔法陣を設置し、無数の雷で敵を翻弄する。取得するたび範囲、設置時間、威力が伸びる。攻撃速度で再設置も早くなる。", classes: ["witch"], apply: (p) => (p.thunderCircle += 1) },
  { name: "ファイア巨大化", desc: "ファイアが大きくなり、魔力爆発の範囲と威力が伸びる。さらに連鎖爆発が+1される。", classes: ["witch"], apply: (p) => { p.magicRadius += 0.12; p.damage *= 1.08; p.magicSplash += 1; p.chainExplosion += 1; } },
  { name: "剣閃範囲 +10度", desc: "薙ぎ払いの横範囲が10度広がり、奥への届く距離も10%伸びる。", classes: ["saber"], apply: (p) => { p.slashArc += THREE.MathUtils.degToRad(10); p.slashRange *= 1.1; } },
  { name: "飛燕斬", desc: "通常攻撃と同時に飛ぶ斬撃を放つ。初回は威力67%、貫通0。以後は1回ごとに威力+12%、大きさ+0.08、貫通+2。", classes: ["saber"], apply: (p) => (p.flyingSlash += 1) },
  { name: "二連斬り", desc: "薙ぎ払いの直後に、少しずらした追加の斬撃を放つ。", classes: ["saber"], apply: (p) => (p.doubleSlash += 1) },
  { name: "風魔手裏剣", desc: "手裏剣が風をまとい、取得するたび威力+15%、大きさ+0.06、飛距離が少し伸びる。", classes: ["ninja"], apply: (p) => (p.fumaShuriken += 1) },
  { name: "影分身", desc: "通常攻撃時に分身が追加の手裏剣を投げる。取得するたび分身が増える。", classes: ["ninja"], apply: (p) => (p.shadowClone += 1) },
  { name: "影縫い", desc: "刀と手裏剣に短時間スローを付与する。取得するたびスロー時間が伸びる。", classes: ["ninja"], apply: (p) => (p.shadowBind += 1) }
);

initThree();
preloadFbxAssets();
state = newState([{ id: localPlayerId, name: playerName(), character: selectedCharacter() }]);
applyStageTheme(state.stageId);
render();
updateUi();
updateOnlineBadge();
updateProgressUi();
renderRoomList();
loadAudioSettings();
startPresenceHeartbeat();

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101419);
  scene.fog = new THREE.Fog(0x101419, 42, 86);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 160);
  camera.position.set(0, 21, 20);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xdde9ff, 0x1b1713, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-14, 32, 18);
  sun.castShadow = true;
  scene.add(sun);

  arenaFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.9, metalness: 0.05 })
  );
  arenaFloor.rotation.x = -Math.PI / 2;
  arenaFloor.receiveShadow = true;
  scene.add(arenaFloor);

  arenaGrid = new THREE.GridHelper(WORLD.half * 2, 28, 0x48606a, 0x29343a);
  arenaGrid.position.y = 0.03;
  scene.add(arenaGrid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x384049, roughness: 0.8 });
  arenaWalls = [];
  for (const [x, z, w, d] of [
    [0, -WORLD.half, WORLD.half * 2, 0.6],
    [0, WORLD.half, WORLD.half * 2, 0.6],
    [-WORLD.half, 0, 0.6, WORLD.half * 2],
    [WORLD.half, 0, 0.6, WORLD.half * 2],
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), wallMaterial);
    mesh.position.set(x, 0.55, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    arenaWalls.push(mesh);
  }
  stageDecor = new THREE.Group();
  scene.add(stageDecor);

  resize();
  window.addEventListener("resize", resize);
}

function applyStageTheme(stageId) {
  const stage = STAGES[stageId] || STAGES.stage1;
  const mine = stage.rockfalls;
  const castle = stage.castle;
  const forest = stageId === "stage1";
  scene.background = new THREE.Color(mine ? 0x0b1016 : castle ? 0x171a21 : forest ? 0x102017 : 0x101419);
  scene.fog = new THREE.Fog(mine ? 0x0b1016 : castle ? 0x171a21 : forest ? 0x102017 : 0x101419, mine ? 30 : castle ? 38 : forest ? 34 : 42, mine ? 70 : castle ? 86 : forest ? 76 : 86);
  if (arenaFloor) arenaFloor.material.color.set(mine ? 0x171b20 : castle ? 0x3b4047 : forest ? 0x24472b : 0x20262b);
  if (arenaGrid) {
    const mats = Array.isArray(arenaGrid.material) ? arenaGrid.material : [arenaGrid.material];
    for (const mat of mats) mat.color?.set(mine ? 0x334155 : castle ? 0x2d333a : forest ? 0x3f6f44 : 0x48606a);
  }
  for (const wall of arenaWalls) wall.material.color.set(mine ? 0x2f343b : castle ? 0x4f5661 : forest ? 0x2b4a2f : 0x384049);
  if (!stageDecor) return;
  while (stageDecor.children.length) stageDecor.remove(stageDecor.children[0]);
  if (mine) addMineDecor();
  else if (castle) addCastleDecor();
  else if (forest) addForestDecor();
}

function addForestDecor() {
  for (let i = 0; i < 52; i += 1) {
    const side = Math.floor(i / 13);
    const t = -WORLD.half + 2 + (i % 13) * ((WORLD.half * 2 - 4) / 12);
    const jitter = (Math.random() - 0.5) * 2.2;
    const x = side < 2 ? t + jitter : (side === 2 ? -WORLD.half + 1.2 : WORLD.half - 1.2);
    const z = side < 2 ? (side === 0 ? -WORLD.half + 1.2 : WORLD.half - 1.2) : t + jitter;
    stageDecor.add(makeForestTree(x, z, 1.0 + Math.random() * 0.45));
  }
  for (const [x, z, r] of [[-18, -7, 0.5], [15, 9, -0.4], [-4, 22, 0.2], [22, -18, 0.8]]) addFallenLog(x, z, r);
  for (const [x, z] of [[-24, 12], [-10, -19], [7, 18], [20, -4], [2, -26], [-28, -16]]) addForestRock(x, z);
  for (let i = 0; i < 44; i += 1) addGrassClump(randomFieldPoint(), randomFieldPoint());
}

function makeForestTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.34 * scale, 0.5 * scale, 2.8 * scale, 9), materials.bark.clone());
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  const crownA = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * scale, 1), materials.darkLeaves.clone());
  crownA.position.y = 3.1 * scale;
  crownA.scale.set(1.15, 0.9, 1.05);
  crownA.castShadow = true;
  const crownB = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * scale, 1), materials.leaves.clone());
  crownB.position.set(0.35 * scale, 3.75 * scale, -0.15 * scale);
  crownB.castShadow = true;
  group.add(trunk, crownA, crownB);
  group.position.set(x, 0, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

function addFallenLog(x, z, rotation) {
  const log = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 4.8, 10), materials.bark.clone());
  trunk.rotation.z = Math.PI / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  log.add(trunk);
  for (const offset of [-1.65, 1.4]) {
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.1, 7), materials.bark.clone());
    nub.position.set(offset, 0.25, 0.12);
    nub.rotation.set(0.8, 0.2, 0.9);
    nub.castShadow = true;
    log.add(nub);
  }
  log.position.set(x, 0.45, z);
  log.rotation.y = rotation;
  stageDecor.add(log);
}

function addForestRock(x, z) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 + Math.random() * 0.35, 0), materials.rock.clone());
  rock.position.set(x, 0.38, z);
  rock.scale.set(1.25, 0.55, 0.9);
  rock.rotation.y = Math.random() * Math.PI;
  rock.castShadow = true;
  rock.receiveShadow = true;
  stageDecor.add(rock);
}

function addGrassClump(x, z) {
  const clump = new THREE.Group();
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i += 1) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55 + Math.random() * 0.35, 5), materials.grass.clone());
    blade.position.set((Math.random() - 0.5) * 0.7, 0.25, (Math.random() - 0.5) * 0.7);
    blade.rotation.z = (Math.random() - 0.5) * 0.45;
    blade.castShadow = true;
    clump.add(blade);
  }
  clump.position.set(x, 0, z);
  stageDecor.add(clump);
}

function addMineDecor() {
  const points = [
    [-27, -22], [-18, 25], [-7, -29], [10, 27], [25, -17], [27, 14],
    [-29, 5], [18, -27], [-23, 18], [3, -24], [23, 26], [-12, 30],
  ];
  for (const [x, z] of points) {
    const group = new THREE.Group();
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      const height = 1.3 + Math.random() * 1.7;
      const radius = 0.28 + Math.random() * 0.22;
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        (i % 2 === 0 ? materials.crystal : materials.violetCrystal).clone()
      );
      crystal.position.set((Math.random() - 0.5) * 1.4, height / 2, (Math.random() - 0.5) * 1.4);
      crystal.rotation.z = (Math.random() - 0.5) * 0.35;
      crystal.rotation.y = Math.random() * Math.PI;
      crystal.castShadow = true;
      group.add(crystal);
    }
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.5, 0), materials.rock.clone());
    base.position.y = 0.32;
    base.scale.y = 0.45;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    group.position.set(x, 0, z);
    stageDecor.add(group);
  }
  addMineGroundDetail();
  addMineTimberBorder();
  addMineSupport(-22, -10, 0.28, 1.0);
  addMineSupport(16, -23, -0.45, 0.86);
  addMineSupport(24, 6, 0.62, 0.92);
  addMineSupport(-10, 22, -0.18, 0.78);
  addMineRails();
  addMineCart(-8, -4, 0.18);
  addMineCart(19, 13, -0.5);
}

function addMineGroundDetail() {
  const veinMatA = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.18, depthWrite: false });
  const veinMatB = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.2, depthWrite: false });
  for (let i = 0; i < 18; i += 1) {
    const length = 3.0 + Math.random() * 5.2;
    const width = 0.08 + Math.random() * 0.12;
    const vein = new THREE.Mesh(new THREE.BoxGeometry(width, 0.018, length), i % 2 === 0 ? veinMatA.clone() : veinMatB.clone());
    vein.position.set(randomFieldPoint(), 0.032, randomFieldPoint());
    vein.rotation.y = Math.random() * Math.PI;
    stageDecor.add(vein);
  }
  for (let i = 0; i < 34; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.28, 0), i % 5 === 0 ? materials.violetCrystal.clone() : materials.darkStone.clone());
    rock.position.set(randomFieldPoint(), 0.09, randomFieldPoint());
    rock.scale.y = 0.38 + Math.random() * 0.22;
    rock.rotation.y = Math.random() * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;
    stageDecor.add(rock);
  }
}

function addMineTimberBorder() {
  for (let i = 0; i < 32; i += 1) {
    const side = Math.floor(i / 8);
    const t = -WORLD.half + 5 + (i % 8) * ((WORLD.half * 2 - 10) / 7);
    const x = side < 2 ? t : (side === 2 ? -WORLD.half + 1.4 : WORLD.half - 1.4);
    const z = side < 2 ? (side === 0 ? -WORLD.half + 1.4 : WORLD.half - 1.4) : t;
    const rotation = side < 2 ? Math.PI / 2 : 0;
    addMineSupport(x, z, rotation, 0.72 + Math.random() * 0.16);
  }
}

function addMineSupport(x, z, rotation = 0, scale = 1) {
  const group = new THREE.Group();
  const wood = materials.mineWood.clone();
  const postGeo = new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 3.2 * scale, 8);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, wood.clone());
    post.position.set(side * 1.05 * scale, 1.6 * scale, 0);
    post.rotation.z = side * 0.06;
    post.castShadow = true;
    group.add(post);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 2.55 * scale, 8), wood.clone());
  beam.position.y = 3.12 * scale;
  beam.rotation.z = Math.PI / 2;
  beam.castShadow = true;
  group.add(beam);
  const braceA = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 2.25 * scale, 7), wood.clone());
  braceA.position.set(-0.42 * scale, 2.2 * scale, 0);
  braceA.rotation.z = 0.68;
  braceA.castShadow = true;
  const braceB = braceA.clone();
  braceB.position.x = 0.42 * scale;
  braceB.rotation.z = -0.68;
  group.add(braceA, braceB);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  stageDecor.add(group);
}

function addMineRails() {
  const railMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.42, metalness: 0.72 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5b3a25, roughness: 0.85 });
  const railA = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 58), railMat);
  const railB = railA.clone();
  railA.position.set(-0.92, 0.24, 0);
  railB.position.set(0.92, 0.24, 0);
  const railGroup = new THREE.Group();
  railGroup.rotation.y = -0.42;
  railGroup.add(railA, railB);
  for (let i = -13; i <= 13; i += 1) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.12, 0.38), woodMat);
    sleeper.position.set(0, 0.08, i * 2.1);
    sleeper.receiveShadow = true;
    railGroup.add(sleeper);
  }
  stageDecor.add(railGroup);
}

function addMineCart(x, z, rotation) {
  const cart = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.58, metalness: 0.32 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.05, 1.75), bodyMat);
  body.position.y = 0.85;
  body.scale.y = 0.75;
  body.castShadow = true;
  body.receiveShadow = true;
  cart.add(body);
  const oreMat = materials.violetCrystal.clone();
  for (let i = 0; i < 5; i += 1) {
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.12, 0), oreMat);
    ore.position.set((Math.random() - 0.5) * 1.6, 1.35 + Math.random() * 0.28, (Math.random() - 0.5) * 0.8);
    ore.castShadow = true;
    cart.add(ore);
  }
  for (const wx of [-1.1, 1.1]) {
    for (const wz of [-0.62, 0.62]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 14), rimMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.32, wz);
      wheel.castShadow = true;
      cart.add(wheel);
    }
  }
  cart.position.set(x, 0, z);
  cart.rotation.y = rotation;
  stageDecor.add(cart);
}

function addCastleDecor() {
  addCastleFloorDetail();
  addCastleCarpet();
  addCastleWalls();
  addCastleProp("castleWell", 0, 0, 0, 0.9, makeOldCastleWell);
  addCastleProp("castleTarget", -17, -11, 0.55, 0.9, makeOldCastleTarget);
  addCastleProp("castleTarget", -13, -16, 0.2, 0.85, makeOldCastleTarget);
  addCastleProp("castleBanner", 21, -8, -0.35, 1.1, makeOldCastleBanner);
  addCastleProp("castleBanner", -21, 8, 0.35, 1.1, makeOldCastleBanner);
  addCastleProp("castleBanner", 13, 22, -0.15, 0.95, makeOldCastleBanner);
  addCastleProp("castleBanner", -13, 22, 0.15, 0.95, makeOldCastleBanner);
  addCastleProp("castleBridge", 0, -(WORLD.half + 0.85), 0, 0.95, makeOldCastleBridge);
  for (const [x, z] of [[-24, -24], [24, -24], [-24, 24], [24, 24], [-10, -18], [10, -18]]) addCastleTorch(x, z);
  for (const [x, z, r] of [[-7, 9, 0.25], [7, 9, -0.25], [-18, 2, 0.55], [18, 2, -0.55]]) addCastleStatue(x, z, r);
  for (const [x, z] of [[-22, 19], [20, 20], [-19, -23], [23, -18], [8, 25], [-7, -24]]) addCastleCrate(x, z);
}

function addCastleWalls() {
  const wallHalf = WORLD.half + 1.15;
  const towerHalf = wallHalf - 1.05;
  const spacing = 7.25;
  const southWall = { opacity: 0.38 };
  for (let i = -4; i <= 4; i += 1) {
    if (i !== 0) {
      addCastleProp(i % 2 ? "castleWall" : "castleWallBricks", i * spacing, -wallHalf, 0, 1.05, makeOldCastleWall);
      addCastleProp(i % 2 ? "castleWallBricks" : "castleWall", i * spacing, wallHalf, Math.PI, 1.05, makeOldCastleWall, southWall);
    }
    addCastleProp(i % 2 ? "castleWall" : "castleWallBricks", -wallHalf, i * spacing, Math.PI / 2, 1.05, makeOldCastleWall);
    addCastleProp(i % 2 ? "castleWallBricks" : "castleWall", wallHalf, i * spacing, -Math.PI / 2, 1.05, makeOldCastleWall);
  }
  addCastleProp("castleWallEntrance", 0, -wallHalf, 0, 1.08, makeOldCastleGate);
  addCastleProp("castleWallEntrance", 0, wallHalf, Math.PI, 1.08, makeOldCastleGate, southWall);
  for (const [x, z, key, rot] of [
    [-towerHalf, -towerHalf, "castlePointyTower", 0],
    [towerHalf, -towerHalf, "castlePointyTower", 0],
    [-towerHalf, towerHalf, "castlePointyTower", 0],
    [towerHalf, towerHalf, "castlePointyTower", 0],
  ]) addCastleProp(key, x, z, rot, 2.0, makeOldCastleTower);
}

function addCastleFloorDetail() {
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c6068, roughness: 0.9 });
  const paleStoneMat = new THREE.MeshStandardMaterial({ color: 0x777b82, roughness: 0.88 });
  const violetStoneMat = new THREE.MeshStandardMaterial({ color: 0x50475f, roughness: 0.9 });
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x80858d, roughness: 0.88 });
  const roadA = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.025, WORLD.half * 1.68), pathMat);
  const roadB = new THREE.Mesh(new THREE.BoxGeometry(WORLD.half * 1.68, 0.025, 6.2), pathMat.clone());
  roadA.position.y = 0.035;
  roadB.position.y = 0.036;
  roadA.receiveShadow = true;
  roadB.receiveShadow = true;
  stageDecor.add(roadA, roadB);
  for (let i = 0; i < 40; i += 1) {
    const tileMat = i % 9 === 0 ? violetStoneMat.clone() : i % 4 === 0 ? paleStoneMat.clone() : stoneMat.clone();
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.9 + Math.random() * 1.4, 0.02, 0.45 + Math.random() * 1.0), tileMat);
    tile.position.set(randomFieldPoint(), 0.045, randomFieldPoint());
    tile.rotation.y = Math.random() * Math.PI;
    tile.receiveShadow = true;
    stageDecor.add(tile);
  }
}

function addCastleCarpet() {
  const redMat = new THREE.MeshStandardMaterial({ color: 0x8f1d2c, roughness: 0.74 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.46, metalness: 0.12 });
  const runner = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.035, 46), redMat);
  runner.position.y = 0.06;
  const cross = new THREE.Mesh(new THREE.BoxGeometry(26, 0.034, 2.2), redMat.clone());
  cross.position.set(0, 0.061, 0);
  stageDecor.add(runner, cross);
  for (const x of [-1.55, 1.55]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 46), goldMat.clone());
    trim.position.set(x, 0.08, 0);
    stageDecor.add(trim);
  }
  for (const z of [-1.25, 1.25]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(26, 0.04, 0.1), goldMat.clone());
    trim.position.set(0, 0.081, z);
    stageDecor.add(trim);
  }
}

function addCastleTorch(x, z) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.8, 7), materials.mineWood.clone());
  pole.position.y = 0.9;
  pole.castShadow = true;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.26, 10), new THREE.MeshStandardMaterial({ color: 0x2b2520, roughness: 0.62, metalness: 0.18 }));
  bowl.position.y = 1.86;
  bowl.castShadow = true;
  const flameA = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.58, 8), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.92 }));
  flameA.position.y = 2.25;
  const flameB = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), new THREE.MeshBasicMaterial({ color: 0xfff0a6, transparent: true, opacity: 0.82 }));
  flameB.position.y = 2.31;
  group.add(pole, bowl, flameA, flameB);
  group.position.set(x, 0, z);
  stageDecor.add(group);
}

function addCastleStatue(x, z, rotation = 0) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.86 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.45, 1.25), mat);
  base.position.y = 0.22;
  base.castShadow = true;
  base.receiveShadow = true;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.25, 8), mat.clone());
  body.position.y = 1.05;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat.clone());
  head.position.y = 1.8;
  head.castShadow = true;
  const sword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x8d929b, roughness: 0.38, metalness: 0.38 }));
  sword.position.set(0.42, 1.1, 0);
  sword.rotation.z = -0.28;
  sword.castShadow = true;
  group.add(base, body, head, sword);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  stageDecor.add(group);
}

function addCastleProp(key, x, z, rotation = 0, scale = 1, fallbackFactory = null, options = {}) {
  const prop = makeFbxMesh(key, fallbackFactory || (() => new THREE.Group()), options);
  prop.position.set(x, 0, z);
  prop.rotation.y = rotation;
  prop.scale.setScalar(scale);
  stageDecor.add(prop);
  return prop;
}

function addCastleCrate(x, z) {
  const group = new THREE.Group();
  const wood = materials.mineWood.clone();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.2), wood);
  box.position.y = 0.5;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.12), materials.darkStone.clone());
  strap.position.y = 0.84;
  strap.castShadow = true;
  group.add(strap);
  group.position.set(x, 0, z);
  group.rotation.y = Math.random() * Math.PI;
  stageDecor.add(group);
}

function makeOldCastleWall() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8d5cc, roughness: 0.72 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.4, 0.55), mat);
  wall.position.y = 1.2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
  for (let i = -2; i <= 2; i += 1) {
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), mat.clone());
    merlon.position.set(i * 1.15, 2.72, 0);
    merlon.castShadow = true;
    group.add(merlon);
  }
  return group;
}

function makeOldCastleGate() {
  const group = makeOldCastleWall();
  const arch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.65, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a2a21, roughness: 0.9 }));
  arch.position.y = 0.82;
  group.add(arch);
  return group;
}

function makeOldCastleTower() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8d5cc, roughness: 0.7 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 4.5, 10), mat);
  tower.position.y = 2.25;
  tower.castShadow = true;
  group.add(tower);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.7, 10), new THREE.MeshStandardMaterial({ color: 0xd94c5d, roughness: 0.6 }));
  roof.position.y = 5.15;
  roof.castShadow = true;
  group.add(roof);
  return group;
}

function makeOldCastleWell() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.9, 16), materials.rock.clone());
  base.position.y = 0.45;
  base.castShadow = true;
  group.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 4), new THREE.MeshStandardMaterial({ color: 0xd94c5d, roughness: 0.62 }));
  roof.position.y = 1.55;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);
  return group;
}

function makeOldCastleTarget() {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), materials.bark.clone());
  stand.position.y = 0.6;
  const target = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 8, 24), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  target.position.y = 1.25;
  target.rotation.x = Math.PI / 2;
  group.add(stand, target);
  return group;
}

function makeOldCastleBanner() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 7), materials.bark.clone());
  pole.position.y = 1.1;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0xd94c5d, roughness: 0.5 }));
  flag.position.set(0.42, 1.65, 0);
  group.add(pole, flag);
  return group;
}

function makeOldCastleBridge() {
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.28, 2.1), materials.mineWood.clone());
  bridge.position.y = 0.14;
  bridge.castShadow = true;
  bridge.receiveShadow = true;
  return bridge;
}

function newState(playerInfos, options = {}) {
  const players = playerInfos.map((info, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, playerInfos.length);
    const player = makePlayer(info.id, info.name, Math.sin(angle) * 2, Math.cos(angle) * 2, info.id === localPlayerId, info.character || "archer");
    scene.add(player.mesh);
    return player;
  });

  return {
    running: false,
    paused: false,
    won: false,
    elapsed: 0,
    spawnTimer: 0,
    bossSpawned: false,
    midBossSpawned: {},
    heartTimer: 8 + Math.random() * 12,
    magnetTimer: 24 + Math.random() * 24,
    rockfallTimer: 30,
    pauseReason: null,
    pendingLevel: null,
    players,
    stageId: STAGES[options.stageId] ? options.stageId : "stage1",
    difficultyId: DIFFICULTIES[options.difficultyId] ? options.difficultyId : "normal",
    enemies: [],
    arrows: [],
    enemyBullets: [],
    gems: [],
    hearts: [],
    magnets: [],
    magicCircles: [],
    rockfalls: [],
    bossZones: [],
    effects: [],
    kills: 0,
    thunderSoundAt: 0,
    renderCache: { players: new Map(), enemies: new Map(), arrows: new Map(), bullets: new Map(), gems: new Map(), hearts: new Map(), magnets: new Map(), circles: new Map(), rockfalls: new Map(), bossZones: new Map(), effects: new Map() },
  };
}

function makePlayer(id, name, x, z, local, character = "archer") {
  const type = CHARACTER_TYPES[character] ? character : "archer";
  const player = {
    id,
    name,
    character: type,
    x,
    z,
    radius: 1.05,
    hp: 100,
    maxHp: 100,
    level: 1,
    xp: 0,
    xpNext: 18,
    speed: 9.4,
    damage: 16,
    arrows: 1,
    baseFireRate: 0.6,
    attackSpeedBonus: 0,
    fireRate: 0.6,
    fireTimer: 0,
    skillCharge: 0,
    skillCooldown: 30,
    pierce: 0,
    backShots: 0,
    magnet: 4.6,
    lifeSteal: 0,
    rerolls: 5,
    upgrades: [],
    input: { dx: 0, dz: 0, aimX: 0, aimZ: -8 },
    walkTime: 0,
    local,
    dead: false,
    reviveAt: 0,
    invincibleUntil: 0,
    hitFlash: 0,
    pendingChoices: [],
    magicBolts: 1,
    magicSplash: 0,
    magicRadius: 0.34,
    chainExplosion: 0,
    iceSpike: 0,
    iceTimer: 3.2,
    thunderCircle: 0,
    thunderTimer: 2.8,
    slashArc: THREE.MathUtils.degToRad(90),
    slashRange: 5.2,
    flyingSlash: 0,
    doubleSlash: 0,
    spinSlashUntil: 0,
    spinSlashAngle: 0,
    spinSlashTick: 0,
    spinSlashVisual: 0,
    fumaShuriken: 0,
    shadowClone: 0,
    shadowBind: 0,
    mesh: makePlayerMesh(name, local, type),
  };
  if (type === "witch") {
    player.damage = 14;
    player.baseFireRate = 0.8;
    player.speed = 9.0;
    player.magicSplash = 1;
  } else if (type === "saber") {
    player.damage = 34;
    player.baseFireRate = 2;
    player.speed = 9.8;
    player.arrows = 0;
    player.pierce = 0;
  } else if (type === "ninja") {
    player.damage = 21;
    player.baseFireRate = 0.82;
    player.speed = 9.4 * 1.15;
    player.skillCooldown = 10;
    player.arrows = 0;
    player.pierce = 0;
    player.slashArc = THREE.MathUtils.degToRad(74);
    player.slashRange = 3.75;
  }
  applyPermanentBonuses(player);
  updateFireRate(player);
  return player;
}

function addAttackSpeed(player, amount) {
  player.attackSpeedBonus = (player.attackSpeedBonus || 0) + amount;
  updateFireRate(player);
}

function updateFireRate(player) {
  const base = player.baseFireRate || player.fireRate || 0.6;
  player.baseFireRate = base;
  player.fireRate = base / (1 + (player.attackSpeedBonus || 0));
}

function makePlayerMesh(name, local, character = "archer", options = {}) {
  const group = new THREE.Group();
  const type = CHARACTER_TYPES[character] ? character : "archer";
  const useLegacyModel = Boolean(options.legacy);
  const useExternalModel = !useLegacyModel && Boolean(CHARACTER_MODELS[type]);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: local ? CHARACTER_TYPES[type].color : CHARACTER_TYPES[type].remoteColor,
    roughness: type === "saber" ? 0.38 : 0.55,
    metalness: type === "saber" ? 0.25 : 0,
  });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 6, 14), bodyMat);
  body.position.y = 1.35;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), materials.skin);
  head.position.y = 2.18;
  head.castShadow = true;
  group.add(head);
  const fallbackCore = [body, head];

  const armGeo = new THREE.CapsuleGeometry(0.13, 0.62, 4, 8);
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.72, 4, 8);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, bodyMat);
    arm.name = side < 0 ? "leftArm" : "rightArm";
    arm.position.set(side * 0.52, 1.45, 0);
    arm.rotation.z = side * 0.18;
    arm.castShadow = true;
    group.add(arm);

    const leg = new THREE.Mesh(legGeo, bodyMat);
    leg.name = side < 0 ? "leftLeg" : "rightLeg";
    leg.position.set(side * 0.24, 0.58, 0);
    leg.castShadow = true;
    group.add(leg);
    fallbackCore.push(arm, leg);
  }

  const label = makeNameLabel(name);
  label.position.y = 3.35;
  group.add(label);
  const propMeshes = addCharacterProps(group, type, bodyMat, useLegacyModel) || [];
  const coffin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 1.45), new THREE.MeshStandardMaterial({ color: 0x5b3424, roughness: 0.85 }));
  coffin.name = "coffin";
  coffin.position.y = 0.42;
  coffin.visible = false;
  coffin.castShadow = true;
  group.add(coffin);
  group.userData.parts = {
    leftArm: group.getObjectByName("leftArm"),
    rightArm: group.getObjectByName("rightArm"),
    leftLeg: group.getObjectByName("leftLeg"),
    rightLeg: group.getObjectByName("rightLeg"),
    coffin,
  };
  group.userData.fallbackCore = fallbackCore;
  group.userData.characterProps = propMeshes;
  group.userData.externalModelPending = useExternalModel;
  if (useExternalModel) setFallbackModelVisible(group, false);
  if (!useLegacyModel) attachCharacterModel(group, type);
  return group;
}

function addCharacterProps(group, character, bodyMat, useLegacyModel = false) {
  if (character === "witch") {
    const staff = useLegacyModel ? makeOldStaffMesh() : makeFbxMesh("staff", makeOldStaffMesh);
    group.add(staff);
    return [staff];
  }
  if (character === "saber") {
    const sword = useLegacyModel ? makeOldSwordMesh(bodyMat) : makeFbxMesh("sword", () => makeOldSwordMesh(bodyMat));
    group.add(sword);
    return [sword];
  }
  if (character === "ninja") {
    const weapon = makeNinjaWeaponMesh(bodyMat);
    group.add(weapon);
    return [weapon];
  }
  const bow = useLegacyModel ? makeOldBowMesh() : makeFbxMesh("bow", makeOldBowMesh);
  group.add(bow);
  return [bow];
}

function makeOldBowMesh() {
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 8, 24, Math.PI * 1.35), materials.arrow);
  bow.position.set(-0.34, 1.26, 0.08);
  bow.rotation.set(Math.PI / 2, Math.PI, 0);
  return bow;
}

function makeOldStaffMesh() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.35, 10), materials.witchHat);
  shaft.position.set(0.58, 1.12, 0.08);
  shaft.rotation.z = -0.18;
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), materials.magic);
  gem.position.set(0.72, 1.74, 0.08);
  group.add(shaft, gem);
  return group;
}

function makeOldSwordMesh(bodyMat) {
  const group = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.08), materials.saberBlade);
  blade.name = "saberBlade";
  blade.position.set(0.76, 1.05, 0.02);
  blade.rotation.z = -0.45;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), bodyMat);
  guard.position.set(0.58, 0.63, 0.12);
  guard.rotation.z = -0.45;
  group.add(blade, guard);
  return group;
}

function makeNinjaWeaponMesh(bodyMat) {
  const group = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.06), materials.saberBlade.clone());
  blade.position.set(0.62, 0.92, 0.04);
  blade.rotation.z = -0.62;
  blade.castShadow = true;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.1), bodyMat);
  guard.position.set(0.48, 0.58, 0.1);
  guard.rotation.z = -0.62;
  const shuriken = makeShurikenMesh(0.26);
  shuriken.position.set(-0.45, 1.35, -0.1);
  shuriken.rotation.set(Math.PI / 2, 0, Math.PI / 4);
  group.add(blade, guard, shuriken);
  return group;
}

function attachCharacterModel(group, character) {
  const config = CHARACTER_MODELS[character];
  if (!config) return;
  loadCharacterGltf(config.path).then((gltf) => {
    const model = gltf.scene;
    model.name = "modelRoot";
    model.scale.setScalar(config.scale || 1);
    model.position.y = 0;
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    applyCharacterModelStyle(model, character);
    group.add(model);
    group.userData.modelRoot = model;
    group.userData.keepModelProps = config.keepProps;
    group.userData.externalModelPending = false;
    setFallbackModelVisible(group, false);
    setPlayerDeadVisual({ mesh: group }, Boolean(group.userData.parts?.coffin?.visible));
    const clips = removeRootMotionFromClips(gltf.animations || [], gltf.parser?.json);
    const mixer = new THREE.AnimationMixer(model);
    model.userData.mixer = mixer;
    model.userData.actions = new Map(clips.map((clip) => [clip.name, mixer.clipAction(clip)]));
    model.userData.activeAction = null;
    playModelAction(model, "Idle");
  }).catch((error) => {
    console.warn(`Failed to load character model: ${config.path}`, error);
    group.userData.externalModelPending = false;
    setFallbackModelVisible(group, true);
    setPlayerDeadVisual({ mesh: group }, Boolean(group.userData.parts?.coffin?.visible));
  });
}

function applyCharacterModelStyle(model, character) {
  if (character !== "witch") return;
  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materialsToEdit = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materialsToEdit) {
      if (material.name !== "Hair" || !material.color) continue;
      material.color.set("#c79de2");
      if (material.emissive) material.emissive.setHex(0x17091f);
      material.needsUpdate = true;
    }
  });
}

function setFallbackModelVisible(group, visible) {
  for (const mesh of group.userData.fallbackCore || []) mesh.visible = visible;
  const keepProps = !group.userData.modelRoot || group.userData.keepModelProps;
  for (const mesh of group.userData.characterProps || []) mesh.visible = keepProps ? true : visible;
}

function preloadFbxAssets() {
  for (const key of Object.keys(FBX_ASSETS)) loadFbxAsset(key).catch(() => {});
}

function makeFbxMesh(key, fallbackFactory, options = {}) {
  const wrapper = new THREE.Group();
  const fallback = fallbackFactory ? fallbackFactory() : new THREE.Group();
  applyObjectOpacity(fallback, options.opacity);
  const cached = fbxModelCache.get(key);
  if (cached?.model) {
    const clone = cloneFbxModel(cached.model, key);
    applyObjectOpacity(clone, options.opacity);
    wrapper.add(clone);
    return wrapper;
  }
  wrapper.add(fallback);
  loadFbxAsset(key).then((model) => {
    const clone = cloneFbxModel(model, key);
    applyObjectOpacity(clone, options.opacity);
    wrapper.clear();
    wrapper.add(clone);
  }).catch((error) => console.warn(`Failed to load FBX asset: ${key}`, error));
  return wrapper;
}

function applyObjectOpacity(object, opacity) {
  if (opacity === undefined || opacity === null || opacity >= 1) return;
  object.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of mats) {
      material.transparent = true;
      material.opacity = opacity;
      material.depthWrite = false;
      material.needsUpdate = true;
    }
  });
}

function loadFbxAsset(key) {
  const asset = FBX_ASSETS[key];
  if (!asset) return Promise.reject(new Error(`Unknown FBX asset: ${key}`));
  const cached = fbxModelCache.get(key);
  if (cached?.promise) return cached.promise;
  const promise = new Promise((resolve, reject) => {
    fbxLoader.load(asset.path, (model) => {
      prepareFbxModel(model, key);
      fbxModelCache.set(key, { promise, model });
      resolve(model);
    }, undefined, reject);
  });
  fbxModelCache.set(key, { promise, model: null });
  return promise;
}

function prepareFbxModel(model, key) {
  const asset = FBX_ASSETS[key];
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.sub(center);
  const largest = Math.max(size.x, size.y, size.z) || 1;
  model.scale.multiplyScalar((asset.size || 1) / largest);
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (!child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of mats) {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
    }
  });
}

function cloneFbxModel(model, key) {
  const asset = FBX_ASSETS[key] || {};
  const clone = model.clone(true);
  clone.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    child.material = Array.isArray(child.material) ? child.material.map((mat) => mat.clone()) : child.material.clone();
  });
  if (key.startsWith("castle")) styleCastleFbxModel(clone, key);
  if (key.startsWith("knightBoss")) styleKnightBossFbxModel(clone, key);
  clone.position.set(...(asset.position || [0, 0, 0]));
  clone.rotation.set(...(asset.rotation || [0, 0, 0]));
  clone.scale.multiply(new THREE.Vector3(...(asset.scale || [1, 1, 1])));
  if (key.startsWith("castle") || key.startsWith("knightBoss")) {
    snapModelBottomToGround(clone, asset.groundOffset || 0);
    if (key.startsWith("castle")) addCastleModelAccent(clone, key);
  }
  return clone;
}

function styleKnightBossFbxModel(model, key) {
  const lowerKey = key.toLowerCase();
  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of mats) {
      if (!material.color) continue;
      let color = 0xbfc7d5;
      let roughness = 0.38;
      let metalness = 0.52;
      if (lowerKey.includes("helmet")) color = 0xd8dee8;
      if (lowerKey.includes("shoulders")) color = 0x8f1d2c;
      if (lowerKey.includes("sword")) {
        color = 0xe7eef7;
        roughness = 0.24;
        metalness = 0.68;
      }
      material.color.setHex(color);
      if ("roughness" in material) material.roughness = roughness;
      if ("metalness" in material) material.metalness = metalness;
      material.needsUpdate = true;
    }
  });
}

function snapModelBottomToGround(model, groundOffset = 0) {
  const box = new THREE.Box3().setFromObject(model);
  if (!Number.isFinite(box.min.y)) return;
  model.position.y += groundOffset - box.min.y;
}

function styleCastleFbxModel(model, key) {
  const lowerKey = key.toLowerCase();
  const fullBox = new THREE.Box3().setFromObject(model);
  const fullSize = new THREE.Vector3();
  fullBox.getSize(fullSize);
  const topY = fullBox.max.y - fullSize.y * 0.28;
  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const childBox = new THREE.Box3().setFromObject(child);
    const childCenter = new THREE.Vector3();
    childBox.getCenter(childCenter);
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of mats) {
      if (!material.color) continue;
      const name = `${child.name || ""} ${material.name || ""}`.toLowerCase();
      let color = 0xe8e3d8;
      let roughness = 0.8;
      let metalness = 0.04;
      if (lowerKey.includes("bridge") || name.includes("wood") || name.includes("door")) {
        color = 0xa66a3f;
        roughness = 0.78;
      } else if (lowerKey.includes("banner")) {
        color = name.includes("pole") || name.includes("stick") ? 0xa66a3f : 0xdb4658;
        roughness = 0.74;
      } else if (lowerKey.includes("target")) {
        color = name.includes("arrow") ? 0x6b3f24 : 0xf6f1e7;
        roughness = 0.76;
      } else if ((lowerKey.includes("pointy") || lowerKey.includes("roof")) && childCenter.y >= topY) {
        color = 0xdb4658;
        roughness = 0.7;
      } else if (lowerKey.includes("bricks") || name.includes("brick")) {
        color = 0xd5d1c7;
      } else if (lowerKey.includes("well")) {
        color = childCenter.y > fullBox.min.y + fullSize.y * 0.62 ? 0xdb4658 : 0xd9d3c8;
      }
      material.color.set(color);
      if ("roughness" in material) material.roughness = roughness;
      if ("metalness" in material) material.metalness = metalness;
      material.needsUpdate = true;
    }
  });
}

function addCastleModelAccent(model, key) {
  const lowerKey = key.toLowerCase();
  if (!lowerKey.includes("pointytower")) return;
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const radius = Math.max(size.x, size.z) * 0.5;
  const height = Math.max(1.55, size.y * 0.22);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 8),
    new THREE.MeshStandardMaterial({ color: 0xdb4658, roughness: 0.68, metalness: 0.02 })
  );
  roof.position.set(0, box.max.y - model.position.y - height * 0.34, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  model.add(roof);
}

function loadCharacterGltf(path) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(path, resolve, undefined, reject);
  });
}

function removeRootMotionFromClips(clips, json) {
  const rootJoint = json?.skins?.[0]?.joints?.[0];
  const rootName = rootJoint !== undefined ? json?.nodes?.[rootJoint]?.name : "";
  if (!rootName) return clips;
  return clips.map((clip) => {
    const tracks = clip.tracks.filter((track) => !(track.name === `${rootName}.position` || track.name.endsWith(`/${rootName}.position`)));
    return new THREE.AnimationClip(clip.name, clip.duration, tracks);
  });
}

async function loadSimpleGltf(path) {
  if (!gltfModelCache.has(path)) {
    gltfModelCache.set(path, fetch(path).then((response) => {
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.json();
    }).then((gltf) => ({
      gltf,
      buffers: (gltf.buffers || []).map((buffer) => decodeGltfBuffer(buffer.uri)),
    })));
  }
  return gltfModelCache.get(path);
}

function buildSimpleGltfScene(asset) {
  const { gltf, buffers } = asset;
  const materialsList = (gltf.materials || []).map(makeGltfMaterial);
  const jointSet = new Set((gltf.skins || []).flatMap((skin) => skin.joints || []));
  const nodes = (gltf.nodes || []).map((nodeDef, index) => {
    const node = jointSet.has(index) ? new THREE.Bone() : new THREE.Object3D();
    node.name = gltfNodeName(gltf, index);
    applyGltfNodeTransform(node, nodeDef);
    return node;
  });

  (gltf.nodes || []).forEach((nodeDef, index) => {
    for (const childIndex of nodeDef.children || []) nodes[index].add(nodes[childIndex]);
  });

  const skinnedMeshes = [];
  (gltf.nodes || []).forEach((nodeDef, nodeIndex) => {
    if (nodeDef.mesh === undefined) return;
    const meshDef = gltf.meshes[nodeDef.mesh];
    for (const primitive of meshDef.primitives || []) {
      const mesh = buildGltfPrimitive(gltf, buffers, primitive, materialsList, nodeDef.skin !== undefined);
      if (!mesh) continue;
      nodes[nodeIndex].add(mesh);
      if (mesh.isSkinnedMesh) skinnedMeshes.push({ mesh, skinIndex: nodeDef.skin });
    }
  });

  const root = new THREE.Group();
  const sceneDef = gltf.scenes?.[gltf.scene || 0] || gltf.scenes?.[0];
  for (const nodeIndex of sceneDef?.nodes || []) root.add(nodes[nodeIndex]);
  root.updateMatrixWorld(true);

  for (const item of skinnedMeshes) {
    const skin = gltf.skins?.[item.skinIndex];
    if (!skin) continue;
    const bones = (skin.joints || []).map((jointIndex) => nodes[jointIndex]);
    const inverseData = readGltfAccessor(gltf, buffers, skin.inverseBindMatrices);
    const inverses = [];
    for (let i = 0; i < bones.length; i += 1) {
      const matrix = new THREE.Matrix4();
      if (inverseData) matrix.fromArray(inverseData.array, i * 16);
      inverses.push(matrix);
    }
    item.mesh.bindMode = THREE.DetachedBindMode;
    item.mesh.bind(new THREE.Skeleton(bones, inverses));
  }

  const mixer = new THREE.AnimationMixer(root);
  const clips = buildGltfAnimationClips(gltf, buffers);
  const actions = new Map(clips.map((clip) => [clip.name, mixer.clipAction(clip)]));
  root.userData.mixer = mixer;
  root.userData.actions = actions;
  root.userData.activeAction = null;
  return root;
}

function buildGltfPrimitive(gltf, buffers, primitive, materialsList, skinned) {
  if ((primitive.mode ?? 4) !== 4) return null;
  const geometry = new THREE.BufferGeometry();
  const position = readGltfAccessor(gltf, buffers, primitive.attributes?.POSITION);
  if (!position) return null;
  geometry.setAttribute("position", new THREE.BufferAttribute(position.array, position.itemSize));
  const normal = readGltfAccessor(gltf, buffers, primitive.attributes?.NORMAL);
  if (normal) geometry.setAttribute("normal", new THREE.BufferAttribute(normal.array, normal.itemSize));
  const joints = readGltfAccessor(gltf, buffers, primitive.attributes?.JOINTS_0);
  const weights = readGltfAccessor(gltf, buffers, primitive.attributes?.WEIGHTS_0);
  if (skinned && joints && weights) {
    geometry.setAttribute("skinIndex", new THREE.BufferAttribute(joints.array, joints.itemSize));
    geometry.setAttribute("skinWeight", new THREE.BufferAttribute(weights.array, weights.itemSize));
  }
  const index = readGltfAccessor(gltf, buffers, primitive.indices);
  if (index) geometry.setIndex(new THREE.BufferAttribute(index.array, 1));
  geometry.computeBoundingSphere();
  if (!normal) geometry.computeVertexNormals();
  const material = materialsList[primitive.material] || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
  return skinned && joints && weights ? new THREE.SkinnedMesh(geometry, material) : new THREE.Mesh(geometry, material);
}

function buildGltfAnimationClips(gltf, buffers) {
  return (gltf.animations || []).map((animation) => {
    const tracks = [];
    for (const channel of animation.channels || []) {
      const sampler = animation.samplers[channel.sampler];
      const input = readGltfAccessor(gltf, buffers, sampler.input);
      const output = readGltfAccessor(gltf, buffers, sampler.output);
      if (!input || !output) continue;
      const nodeName = gltfNodeName(gltf, channel.target.node);
      if (isRootMotionTrack(gltf, channel)) continue;
      if (channel.target.path === "translation") tracks.push(new THREE.VectorKeyframeTrack(`${nodeName}.position`, input.array, output.array));
      if (channel.target.path === "rotation") tracks.push(new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, input.array, output.array));
      if (channel.target.path === "scale") tracks.push(new THREE.VectorKeyframeTrack(`${nodeName}.scale`, input.array, output.array));
    }
    return new THREE.AnimationClip(animation.name || "Action", -1, tracks);
  });
}

function isRootMotionTrack(gltf, channel) {
  if (channel.target.path !== "translation") return false;
  const skin = gltf.skins?.[0];
  return skin?.joints?.[0] === channel.target.node;
}

function gltfNodeName(gltf, index) {
  return `${(gltf.nodes[index]?.name || `Node${index}`).replace(/[^A-Za-z0-9_]/g, "_")}_${index}`;
}

function applyGltfNodeTransform(node, nodeDef) {
  if (nodeDef.translation) node.position.fromArray(nodeDef.translation);
  if (nodeDef.rotation) node.quaternion.fromArray(nodeDef.rotation);
  if (nodeDef.scale) node.scale.fromArray(nodeDef.scale);
  if (nodeDef.matrix) {
    const matrix = new THREE.Matrix4().fromArray(nodeDef.matrix);
    matrix.decompose(node.position, node.quaternion, node.scale);
  }
}

function decodeGltfBuffer(uri) {
  if (!uri?.startsWith("data:")) throw new Error("Only embedded glTF buffers are supported.");
  const base64 = uri.slice(uri.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readGltfAccessor(gltf, buffers, accessorIndex) {
  if (accessorIndex === undefined || accessorIndex === null) return null;
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const itemSize = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[accessor.type] || 1;
  const ArrayType = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  }[accessor.componentType];
  if (!ArrayType) throw new Error(`Unsupported glTF component type: ${accessor.componentType}`);
  const buffer = buffers[view.buffer];
  const byteOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const length = accessor.count * itemSize;
  if (view.byteStride && view.byteStride !== itemSize * ArrayType.BYTES_PER_ELEMENT) {
    const output = new ArrayType(length);
    const dataView = new DataView(buffer.buffer, buffer.byteOffset + byteOffset, view.byteLength - (accessor.byteOffset || 0));
    for (let i = 0; i < accessor.count; i += 1) {
      for (let j = 0; j < itemSize; j += 1) {
        const offset = i * view.byteStride + j * ArrayType.BYTES_PER_ELEMENT;
        output[i * itemSize + j] = readGltfComponent(dataView, offset, accessor.componentType);
      }
    }
    return { array: output, itemSize };
  }
  return { array: new ArrayType(buffer.buffer, buffer.byteOffset + byteOffset, length), itemSize };
}

function readGltfComponent(dataView, offset, componentType) {
  if (componentType === 5120) return dataView.getInt8(offset);
  if (componentType === 5121) return dataView.getUint8(offset);
  if (componentType === 5122) return dataView.getInt16(offset, true);
  if (componentType === 5123) return dataView.getUint16(offset, true);
  if (componentType === 5125) return dataView.getUint32(offset, true);
  return dataView.getFloat32(offset, true);
}

function makeGltfMaterial(materialDef = {}) {
  const pbr = materialDef.pbrMetallicRoughness || {};
  const factor = pbr.baseColorFactor || [1, 1, 1, 1];
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(factor[0], factor[1], factor[2]),
    roughness: pbr.roughnessFactor ?? 0.55,
    metalness: pbr.metallicFactor ?? 0,
    transparent: factor[3] < 1,
    opacity: factor[3] ?? 1,
    side: THREE.DoubleSide,
  });
  return material;
}

function makeNameLabel(name) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = 64;
  const labelCtx = labelCanvas.getContext("2d");
  labelCtx.fillStyle = "rgba(0,0,0,0.55)";
  labelCtx.fillRect(12, 8, 232, 42);
  labelCtx.fillStyle = "#f3f0e8";
  labelCtx.font = "700 24px sans-serif";
  labelCtx.textAlign = "center";
  labelCtx.textBaseline = "middle";
  labelCtx.fillText(name || "Player", 128, 30);
  const texture = new THREE.CanvasTexture(labelCanvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(5.2, 1.3, 1);
  return sprite;
}

function startGame(mode = "solo") {
  cancelAnimationFrame(animationId);
  stopEndSounds();
  setMenuBackdrop(false);
  if (state) resetSceneEntities();
  net.mode = mode;
  net.phase = "playing";
  if (mode !== "client") {
    net.stageId = selectedStage();
    net.difficultyId = selectedDifficulty();
  }
  net.pausedBy = null;
  net.waitingFor = null;
  net.restartVotes = new Set();
  if (mode !== "client") localPlayerId = "host";
  const players = mode === "host" && net.lobbyPlayers.length ? net.lobbyPlayers : [{ id: localPlayerId, name: playerName(), character: selectedCharacter() }];
  state = newState(players, { stageId: net.stageId, difficultyId: net.difficultyId });
  applyStageTheme(state.stageId);
  state.running = true;
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  lastTime = performance.now();
  initAudio();
  sfx("start");
  startBgm();
  ui.start.classList.add("hidden");
  ui.stageSelectPanel.classList.add("hidden");
  ui.lobby.classList.add("hidden");
  ui.levelUp.classList.add("hidden");
  ui.gameOver.classList.add("hidden");
  ui.skillText.closest(".skill-hud")?.classList.remove("hidden");
  hideStatus();
  updateUi();
  updateOnlineBadge();
  updateProgressUi();
  animationId = requestAnimationFrame(loop);
  if (mode === "host") broadcast({ type: "start", players: net.lobbyPlayers, stageId: net.stageId, difficultyId: net.difficultyId });
}

function resetSceneEntities() {
  for (const player of state.players) scene.remove(player.mesh);
  for (const group of [state.enemies, state.arrows, state.enemyBullets, state.gems, state.hearts, state.magnets, state.magicCircles, state.rockfalls, state.bossZones, state.effects]) {
    for (const item of group) scene.remove(item.mesh);
  }
  for (const cache of Object.values(state.renderCache || {})) {
    for (const mesh of cache.values()) scene.remove(mesh);
  }
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  if (state.running) {
    if (net.mode === "client") {
      sendClientInput();
    } else if (!isGamePaused()) {
      update(dt);
      sendHostSnapshot();
    } else {
      updateEffects(dt);
      sendHostSnapshot();
    }
  }
  render();
  animationId = requestAnimationFrame(loop);
}

function update(dt) {
  state.elapsed += dt;
  updatePlayers(dt);
  updateCamera();
  spawnEnemies(dt);
  updateArrows(dt);
  updateEnemies(dt);
  updateEnemyBullets(dt);
  updateMagicCircles(dt);
  updateStageHazards(dt);
  updateBossZones(dt);
  updateGems(dt);
  updateHearts(dt);
  updateMagnets(dt);
  updateRevives();
  updateEffects(dt);
  checkWin();
  updateUi();
}

function updatePlayers(dt) {
  for (const player of state.players) {
    updatePlayerFlash(player, dt);
    if (player.dead || player.hp <= 0) continue;
    player.skillCharge = Math.min(player.skillCooldown || 30, (player.skillCharge || 0) + dt);
    if (player.local) player.input = getLocalInput();
    const spinning = isSaberSpinning(player);
    const moveDx = spinning ? Math.sin(player.spinSlashAngle || 0) : player.input.dx;
    const moveDz = spinning ? Math.cos(player.spinSlashAngle || 0) : player.input.dz;
    const moveSpeed = spinning ? (player.speed || 9.8) * 1.3 : player.speed;
    const moving = spinning || Math.hypot(player.input.dx, player.input.dz) > 0.01;
    player.x = clamp(player.x + moveDx * moveSpeed * dt, -WORLD.half + 1.2, WORLD.half - 1.2);
    player.z = clamp(player.z + moveDz * moveSpeed * dt, -WORLD.half + 1.2, WORLD.half - 1.2);
    player.mesh.position.set(player.x, 0, player.z);

    const angle = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
    player.mesh.rotation.y = spinning ? (player.spinSlashAngle || angle) + state.elapsed * 18 : angle;
    animateHuman(player, moving, dt);
    updateSaberSpinSlash(player, dt);

    player.fireTimer -= dt;
    if (!spinning && player.fireTimer <= 0) {
      shoot(player);
      player.fireTimer = player.fireRate;
    }
    updatePlayerIceSpike(player, dt);
    updatePlayerThunderCircle(player, dt);
  }
}

function updatePlayerIceSpike(player, dt) {
  if ((player.iceSpike || 0) <= 0) return;
  player.iceTimer = (player.iceTimer || 0) - dt;
  if (player.iceTimer > 0) return;
  castIceSpikes(player);
  player.iceTimer = Math.max(2.8, 5.2 - player.iceSpike * 0.22);
}

function updatePlayerThunderCircle(player, dt) {
  if ((player.thunderCircle || 0) <= 0) return;
  player.thunderTimer = (player.thunderTimer || 0) - dt;
  if (player.thunderTimer > 0) return;
  addMagicCircle(player);
  player.thunderTimer = Math.max(2.8, (9.5 - player.thunderCircle * 0.45) * attackIntervalMultiplier(player));
}

function attackIntervalMultiplier(player) {
  return player.baseFireRate ? player.fireRate / player.baseFireRate : 1;
}

function updatePlayerFlash(player, dt) {
  player.hitFlash = Math.max(0, (player.hitFlash || 0) - dt);
  setPlayerFlash(player.mesh, playerFlashMode(player));
}

function playerFlashMode(player) {
  const invincible = state.elapsed < (player.invincibleUntil || 0);
  if (invincible && Math.sin(state.elapsed * 24) > 0) return "invincible";
  if ((player.hitFlash || 0) > 0 && Math.sin(state.elapsed * 42) > 0) return "damage";
  return "";
}

function setPlayerFlash(mesh, mode = "") {
  const color = mode === "damage" ? 0xff2b2b : mode === "invincible" ? 0x7dd3fc : 0x000000;
  mesh.traverse((child) => {
    if (!child.material || !child.material.emissive) return;
    child.material.emissive.setHex(color);
  });
}

function setPlayerDeadVisual(player, dead) {
  const parts = player.mesh.userData.parts;
  if (!parts) return;
  const modelRoot = player.mesh.userData.modelRoot;
  const modelPending = player.mesh.userData.externalModelPending;
  const fallbackCore = player.mesh.userData.fallbackCore || [];
  const characterProps = player.mesh.userData.characterProps || [];
  for (const child of player.mesh.children) {
    if (child === parts.coffin || child.type === "Sprite") continue;
    if ((modelRoot || modelPending) && fallbackCore.includes(child)) {
      child.visible = false;
      continue;
    }
    if ((modelRoot || modelPending) && !player.mesh.userData.keepModelProps && characterProps.includes(child)) {
      child.visible = false;
      continue;
    }
    child.visible = !dead;
  }
  parts.coffin.visible = dead;
  player.mesh.visible = true;
}

function oldSetPlayerFlashUnused(player, flashing, pulse) {
  for (const child of player.mesh.children) {
    if (!child.material || !child.material.emissive) continue;
    child.material.emissive.setHex(flashing && pulse ? 0xff2b2b : 0x000000);
  }
}

function getLocalInput() {
  refreshAimFromPointer();
  let dx = 0;
  let dz = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) dz -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) dz += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
  const len = Math.hypot(dx, dz) || 1;
  return { dx: dx / len, dz: dz / len, aimX: aim.x, aimZ: aim.z };
}

function refreshAimFromPointer() {
  if (!pointerOnCanvas) return;
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, aim);
}

function animateHuman(player, moving, dt) {
  animateHumanMesh(player.mesh, moving, dt);
}

function animateHumanMesh(mesh, moving, dt) {
  const parts = mesh.userData.parts;
  if (!parts) return;
  mesh.userData.walkTime = (mesh.userData.walkTime || 0) + (moving ? dt * 10 : dt * 3);
  if (mesh.userData.modelRoot?.userData.mixer) {
    playModelAction(mesh.userData.modelRoot, moving ? "Walk" : "Idle");
    mesh.userData.modelRoot.userData.mixer.update(dt);
  }
  const swing = moving ? Math.sin(mesh.userData.walkTime) * 0.55 : Math.sin(mesh.userData.walkTime) * 0.06;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
  mesh.position.y = moving ? Math.abs(Math.sin(mesh.userData.walkTime * 2)) * 0.05 : 0;
}

function playModelAction(model, name) {
  const actions = model.userData.actions;
  if (!actions) return;
  const action = actions.get(name) || actions.get("Idle");
  if (!action || model.userData.activeAction === action) return;
  action.enabled = true;
  action.reset().play();
  if (model.userData.activeAction) model.userData.activeAction.crossFadeTo(action, 0.16, false);
  model.userData.activeAction = action;
}

function oldAnimateHumanUnused(player, moving, dt) {
  const parts = player.mesh.userData.parts;
  player.walkTime += moving ? dt * 10 : dt * 3;
  const swing = moving ? Math.sin(player.walkTime) * 0.55 : Math.sin(player.walkTime) * 0.06;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
  player.mesh.position.y = moving ? Math.abs(Math.sin(player.walkTime * 2)) * 0.05 : 0;
}

function updateCamera() {
  const player = cameraTargetPlayer();
  if (!player) return;
  camera.position.x += (player.x - camera.position.x) * 0.08;
  camera.position.z += (player.z + 20 - camera.position.z) * 0.08;
  camera.lookAt(player.x, 0, player.z);
}

function cameraTargetPlayer() {
  const player = localPlayer();
  if (!player?.dead) return player;
  const alive = state.players.filter((p) => !p.dead && p.hp > 0);
  if (!alive.length) return player;
  spectateIndex = clamp(spectateIndex, 0, alive.length - 1);
  const target = alive[spectateIndex];
  showStatus(`${target.name}の画面`, `復活まで ${Math.max(0, Math.ceil(player.reviveAt - state.elapsed))} 秒`);
  return target;
}

function shoot(player) {
  if (player.local || net.mode !== "client") sfx(attackSoundKey(player.character));
  if (player.character === "witch") {
    shootMagic(player);
    return;
  }
  if (player.character === "saber") {
    swingSaber(player);
    return;
  }
  if (player.character === "ninja") {
    attackNinja(player);
    return;
  }
  shootArrows(player);
}

function shootArrows(player) {
  const base = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  const spread = Math.min(0.72, 0.14 * (player.arrows - 1));
  for (let i = 0; i < player.arrows; i += 1) {
    const offset = player.arrows === 1 ? 0 : -spread / 2 + (spread * i) / (player.arrows - 1);
    fireArrow(player, base + offset);
  }
  const backShots = player.backShots || 0;
  if (backShots > 0) {
    const backBase = base + Math.PI;
    const backSpread = Math.min(0.56, 0.16 * (backShots - 1));
    for (let i = 0; i < backShots; i += 1) {
      const offset = backShots === 1 ? 0 : -backSpread / 2 + (backSpread * i) / (backShots - 1);
      fireArrow(player, backBase + offset);
    }
  }
}

function fireArrow(player, angle) {
  const arrow = {
    id: crypto.randomUUID(),
    x: player.x + Math.sin(angle) * 1.15,
    z: player.z + Math.cos(angle) * 1.15,
    startX: player.x,
    startZ: player.z,
    vx: Math.sin(angle) * 24,
    vz: Math.cos(angle) * 24,
    radius: 0.25,
    life: 1.65,
    damage: player.damage,
    pierce: player.pierce,
    owner: player.id,
    kind: "arrow",
    angle,
    hit: new Set(),
    mesh: makeArrowMesh(),
  };
  arrow.mesh.rotation.y = angle;
  arrow.mesh.position.set(arrow.x, 1.1, arrow.z);
  scene.add(arrow.mesh);
  state.arrows.push(arrow);
}

function shootMagic(player) {
  const base = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  const bolts = Math.max(1, player.magicBolts || 1);
  const spread = Math.min(0.9, 0.22 * (bolts - 1));
  for (let i = 0; i < bolts; i += 1) {
    const offset = bolts === 1 ? 0 : -spread / 2 + (spread * i) / (bolts - 1);
    const angle = base + offset;
    const magic = {
      id: crypto.randomUUID(),
      x: player.x + Math.sin(angle) * 1.05,
      z: player.z + Math.cos(angle) * 1.05,
      vx: Math.sin(angle) * 18,
      vz: Math.cos(angle) * 18,
      radius: player.magicRadius || 0.34,
      life: 2.1,
      damage: witchSpellDamage(player),
      pierce: 0,
      owner: player.id,
      kind: "magic",
      splash: player.magicSplash || 0,
      chain: player.chainExplosion || 0,
      angle,
      hit: new Set(),
      mesh: makeProjectileMesh({ kind: "magic" }),
    };
    magic.mesh.scale.setScalar(magic.radius / 0.34);
    magic.mesh.rotation.y = angle;
    magic.mesh.position.set(magic.x, 1.1, magic.z);
    scene.add(magic.mesh);
    state.arrows.push(magic);
  }
}

function witchSpellDamage(player, scale = 1) {
  return player.damage * scale;
}

function swingSaber(player) {
  const base = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  const swings = Math.max(1, 1 + (player.doubleSlash || 0));
  for (let i = 0; i < swings; i += 1) {
    const angle = base + (i === 0 ? 0 : (i % 2 === 0 ? -0.28 : 0.28));
    applySaberSlash(player, angle);
  }
  fireFlyingSlash(player, base);
}

function fireFlyingSlash(player, angle) {
  const level = player.flyingSlash || 0;
  if (level <= 0) return;
  const radius = 0.56 + level * 0.08;
  const slash = {
    id: crypto.randomUUID(),
    x: player.x + Math.sin(angle) * 1.45,
    z: player.z + Math.cos(angle) * 1.45,
    vx: Math.sin(angle) * 20,
    vz: Math.cos(angle) * 20,
    radius,
    life: 1.15 + level * 0.08,
    damage: player.damage * (0.55 + level * 0.12),
    pierce: Math.max(0, (level - 1) * 2),
    owner: player.id,
    kind: "flyingSlash",
    angle,
    hit: new Set(),
    mesh: makeFlyingSlashMesh({ radius }),
  };
  slash.mesh.rotation.y = angle;
  slash.mesh.position.set(slash.x, 1.05, slash.z);
  scene.add(slash.mesh);
  state.arrows.push(slash);
}

function applySaberSlash(player, angle) {
  const range = player.slashRange || 5.2;
  const arc = player.slashArc || THREE.MathUtils.degToRad(90);
  let hit = false;
  for (const enemy of state.enemies) {
    const d = distance(player, enemy);
    if (d > range + enemy.radius) continue;
    const toEnemy = Math.atan2(enemy.x - player.x, enemy.z - player.z);
    if (Math.abs(angleDiff(toEnemy, angle)) > arc / 2) continue;
    enemy.hp -= player.damage;
    enemy.lastHitBy = player.id;
    hit = true;
  }
  addSlashEffect(player.x, player.z, range, arc, angle, hit ? 0xfff1a6 : 0x91c7ff, player.id);
}

function attackNinja(player) {
  const base = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  applyNinjaSlash(player, base);
  fireNinjaShurikenSpread(player, base, ninjaShurikenCount(player), { damageScale: 1, clone: false });
  const clones = Math.min(4, player.shadowClone || 0);
  for (let i = 0; i < clones; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2) + 1;
    const offsetAngle = base + side * (0.32 + row * 0.12);
    const ox = Math.sin(base + side * Math.PI / 2) * (0.9 + row * 0.25);
    const oz = Math.cos(base + side * Math.PI / 2) * (0.9 + row * 0.25);
    addNinjaCloneEffect(player.x + ox, player.z + oz, base);
    fireNinjaShurikenSpread(player, offsetAngle, 1, { damageScale: 0.56, clone: true, originX: player.x + ox, originZ: player.z + oz });
  }
}

function ninjaLevelBonus(player) {
  return Math.floor(Math.max(0, (player.level || 1) - 1) / 5);
}

function ninjaShurikenCount(player) {
  return 1 + ninjaLevelBonus(player);
}

function ninjaShurikenPierce(player) {
  return ninjaLevelBonus(player);
}

function fireNinjaShurikenSpread(player, base, count, options = {}) {
  const spread = Math.min(0.62, 0.18 * (count - 1));
  for (let i = 0; i < count; i += 1) {
    const offset = count === 1 ? 0 : -spread / 2 + (spread * i) / Math.max(1, count - 1);
    fireNinjaShuriken(player, base + offset, options);
  }
}

function fireNinjaShuriken(player, angle, options = {}) {
  const fuma = player.fumaShuriken || 0;
  const radius = 0.32 + fuma * 0.06;
  const speed = 23 + fuma * 1.2;
  const x = options.originX ?? player.x;
  const z = options.originZ ?? player.z;
  const shuriken = {
    id: crypto.randomUUID(),
    x: x + Math.sin(angle) * 1.05,
    z: z + Math.cos(angle) * 1.05,
    vx: Math.sin(angle) * speed,
    vz: Math.cos(angle) * speed,
    radius,
    life: 1.8 + fuma * 0.08,
    damage: player.damage * (0.75 + fuma * 0.15) * (options.damageScale || 1),
    pierce: ninjaShurikenPierce(player),
    owner: player.id,
    kind: "shuriken",
    angle,
    hit: new Set(),
    mesh: makeShurikenProjectileMesh({ radius, fuma }),
  };
  if (options.skill) shuriken.skill = true;
  shuriken.mesh.rotation.y = angle;
  shuriken.mesh.position.set(shuriken.x, 1.05, shuriken.z);
  scene.add(shuriken.mesh);
  state.arrows.push(shuriken);
}

function applyNinjaSlash(player, angle) {
  const range = player.slashRange || 3.75;
  const arc = player.slashArc || THREE.MathUtils.degToRad(74);
  let hit = false;
  for (const enemy of state.enemies) {
    const d = distance(player, enemy);
    if (d > range + enemy.radius) continue;
    const toEnemy = Math.atan2(enemy.x - player.x, enemy.z - player.z);
    if (Math.abs(angleDiff(toEnemy, angle)) > arc / 2) continue;
    enemy.hp -= player.damage * 0.72;
    enemy.lastHitBy = player.id;
    applyNinjaShadowBind(player, enemy);
    hit = true;
  }
  addSlashEffect(player.x, player.z, range, arc, angle, hit ? 0x2dd4bf : 0x67e8f9, player.id);
}

function applyNinjaShadowBind(player, enemy) {
  const level = player.shadowBind || 0;
  if (level <= 0 || !enemy) return;
  const duration = 0.45 + level * 0.35;
  enemy.slowUntil = Math.max(enemy.slowUntil || 0, state.elapsed + duration);
  addRing(enemy.x, enemy.z, 0.82 + level * 0.08, 0x2dd4bf);
}

function isSaberSpinning(player) {
  return player?.character === "saber" && state.elapsed < (player.spinSlashUntil || 0);
}

function updateSaberSpinSlash(player, dt) {
  if (player.character !== "saber") return;
  if (!isSaberSpinning(player)) {
    player.spinSlashTick = 0;
    player.spinSlashVisual = 0;
    return;
  }
  player.invincibleUntil = Math.max(player.invincibleUntil || 0, state.elapsed + 0.08);
  player.spinSlashTick -= dt;
  player.spinSlashVisual -= dt;
  const range = (player.slashRange || 5.2) * 1.08;
  const damage = player.damage * 0.58;
  if (player.spinSlashTick <= 0) {
    player.spinSlashTick = 0.16;
    for (const enemy of state.enemies) {
      if (distance(player, enemy) > range + enemy.radius) continue;
      enemy.hp -= damage;
      enemy.lastHitBy = player.id;
    }
  }
  if (player.spinSlashVisual <= 0) {
    player.spinSlashVisual = 0.08;
    const spin = state.elapsed * 18;
    addSlashEffect(player.x, player.z, range, Math.PI * 1.55, spin, 0x91c7ff, player.id, true);
    addSlashEffect(player.x, player.z, range * 0.72, Math.PI * 1.35, spin + Math.PI, 0xdfe8f3, player.id, true);
  }
}

function requestSkillUse() {
  const player = localPlayer();
  if (!canUseSkill(player)) return;
  if (net.mode === "client") {
    sendToHost({ type: "skill", id: localPlayerId });
    return;
  }
  activateSkill(player);
  if (net.mode === "host") sendHostSnapshot(true);
}

function fillSkillForDebug(playerId = localPlayerId) {
  const player = state?.players?.find((p) => p.id === playerId);
  if (!player || !state.running || net.phase !== "playing") return false;
  player.skillCharge = player.skillCooldown || 30;
  if (player.local) updateUi();
  return true;
}

function requestDebugSkillFill() {
  if (net.phase !== "playing" || !state.running) return;
  if (net.mode === "client") {
    sendToHost({ type: "debugSkillFill", id: localPlayerId });
    return;
  }
  fillSkillForDebug(localPlayerId);
}

function requestDebugBossSpawn(kind) {
  if (net.phase !== "playing" || !state.running) return;
  if (net.mode === "client") {
    sendToHost({ type: "debugBossSpawn", kind });
    return;
  }
  spawnDebugBoss(kind);
}

function spawnDebugBoss(kind) {
  if (!state?.running || net.phase !== "playing") return false;
  if (kind === "boss") {
    state.bossSpawned = true;
    addEnemy(true, false, false, "boss");
    showToast("デバッグ: 大ボス出現");
  } else {
    addEnemy(false, false, false, "mid");
    showToast("デバッグ: 中ボス出現");
  }
  if (net.mode === "host") sendHostSnapshot(true);
  return true;
}

function trackDebugSkillKey() {
  const now = performance.now();
  debugSkillPresses = debugSkillPresses.filter((time) => now - time <= 2000);
  debugSkillPresses.push(now);
  if (debugSkillPresses.length >= 3) {
    debugSkillPresses = [];
    requestDebugSkillFill();
  }
}

function trackDebugBossKey(kind) {
  const now = performance.now();
  debugBossPresses[kind] = debugBossPresses[kind].filter((time) => now - time <= 2000);
  debugBossPresses[kind].push(now);
  if (debugBossPresses[kind].length >= 3) {
    debugBossPresses[kind] = [];
    requestDebugBossSpawn(kind);
  }
}

function attackSoundKey(character) {
  if (character === "witch") return "witchAttack";
  if (character === "saber") return "saberAttack";
  if (character === "ninja") return "saberAttack";
  return "archerAttack";
}

function skillSoundKey(character) {
  if (character === "witch") return "witchSkill";
  if (character === "saber") return "saberSkill";
  if (character === "ninja") return "swordSkill";
  return "archerSkill";
}

function canUseSkill(player) {
  return Boolean(
    player &&
    state?.running &&
    net.phase === "playing" &&
    !isGamePaused() &&
    !player.dead &&
    player.hp > 0 &&
    (player.skillCharge || 0) >= (player.skillCooldown || 30)
  );
}

function activateSkill(player) {
  if (!canUseSkill(player)) return false;
  player.skillCharge = 0;
  sfx(skillSoundKey(player.character), { broadcast: net.mode === "host" });
  const angle = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  if (player.character === "witch") castWitchSkill(player);
  else if (player.character === "saber") castSaberSkill(player, angle);
  else if (player.character === "ninja") castNinjaSkill(player, angle);
  else castArcherSkill(player, angle);
  showSkillBanner(player.name, skillName(player.character));
  if (net.mode === "host") broadcast({ type: "skillBanner", playerName: player.name, skill: skillName(player.character) });
  return true;
}

function skillName(character) {
  if (character === "witch") return "魔女の大爆発";
  if (character === "saber") return "回転突進斬り";
  if (character === "ninja") return "飛影八閃";
  return "アローレイン";
}

function castArcherSkill(player, baseAngle) {
  const count = 18;
  const spread = THREE.MathUtils.degToRad(58);
  for (let i = 0; i < count; i += 1) {
    const angle = baseAngle - spread / 2 + (spread * i) / Math.max(1, count - 1);
    const arrow = {
      id: crypto.randomUUID(),
      x: player.x + Math.sin(angle) * 1.25,
      z: player.z + Math.cos(angle) * 1.25,
      startX: player.x,
      startZ: player.z,
      vx: Math.sin(angle) * 30,
      vz: Math.cos(angle) * 30,
      radius: 0.25,
      life: 3.9,
      damage: player.damage * 1.25,
      pierce: 999,
      owner: player.id,
      kind: "arrow",
      skill: true,
      angle,
      hit: new Set(),
      mesh: makeArrowMesh(),
    };
    arrow.mesh.rotation.y = angle;
    arrow.mesh.position.set(arrow.x, 1.1, arrow.z);
    scene.add(arrow.mesh);
    state.arrows.push(arrow);
  }
  addRing(player.x, player.z, 3.2, 0xf2c14e);
}

function castWitchSkill(player) {
  const radius = 9.5;
  const damage = witchSpellDamage(player, 3.2 + (player.magicSplash || 0) * 0.18);
  addRing(player.x, player.z, radius, 0xff6b2c);
  addRing(player.x, player.z, radius * 0.55, 0xffd166);
  for (const enemy of state.enemies) {
    if (distance(player, enemy) <= radius + enemy.radius) {
      enemy.hp -= damage;
      enemy.lastHitBy = player.id;
    }
  }
}

function castSaberSkill(player, baseAngle) {
  player.spinSlashUntil = state.elapsed + 2;
  player.spinSlashAngle = baseAngle;
  player.spinSlashTick = 0;
  player.spinSlashVisual = 0;
  player.invincibleUntil = Math.max(player.invincibleUntil || 0, state.elapsed + 2);
  addRing(player.x, player.z, (player.slashRange || 5.2) * 1.1, 0x91c7ff);
}

function castNinjaSkill(player, baseAngle) {
  const startX = player.x;
  const startZ = player.z;
  const dashDistance = 9.5;
  player.x = clamp(player.x + Math.sin(baseAngle) * dashDistance, -WORLD.half + 1.2, WORLD.half - 1.2);
  player.z = clamp(player.z + Math.cos(baseAngle) * dashDistance, -WORLD.half + 1.2, WORLD.half - 1.2);
  player.mesh.position.set(player.x, 0, player.z);
  player.invincibleUntil = Math.max(player.invincibleUntil || 0, state.elapsed + 0.55);
  addRing(startX, startZ, 1.7, 0x2dd4bf);
  addRing(player.x, player.z, 2.3, 0x67e8f9);
  addNinjaCloneEffect(startX, startZ, baseAngle);
  addNinjaCloneEffect(player.x, player.z, baseAngle);
  const bonusCount = ninjaLevelBonus(player);
  for (let i = 0; i < 8; i += 1) {
    const base = (Math.PI * 2 * i) / 8;
    for (let j = 0; j <= bonusCount; j += 1) {
      const offset = j === 0 ? 0 : (j % 2 === 0 ? -1 : 1) * (0.08 + Math.floor(j / 2) * 0.05);
      fireNinjaShuriken(player, base + offset, { skill: true, damageScale: 1.18 });
    }
  }
}

function spawnEnemies(dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;
  const pressure = Math.min(1.4, state.elapsed / 105);
  state.spawnTimer = Math.max(0.24, (0.72 - pressure * 0.34) / 0.75);
  const count = state.elapsed > 85 ? 4 : state.elapsed > 40 ? 2 : 1;
  const allowShooters = DIFFICULTIES[state.difficultyId]?.shooterEnemies !== false;
  const allowBombers = STAGES[state.stageId]?.bomberEnemies;
  for (let i = 0; i < count; i += 1) {
    const shooter = allowShooters && state.elapsed > 18 && Math.random() < Math.min(0.12, 0.03 + state.elapsed / 960);
    const bomber = !shooter && allowBombers && state.elapsed >= 180 && Math.random() < Math.min(0.106, 0.026 + state.elapsed / 1800);
    const castleShield = state.stageId === "stage3" && !shooter && !bomber && state.elapsed > 45 && Math.random() < Math.min(0.16, 0.045 + state.elapsed / 2600);
    if (!shooter && Math.random() > 0.75) continue;
    addEnemy(false, shooter, bomber, castleShield ? "castleShield" : "");
  }
  spawnStageMidBosses();
  const bossTime = STAGES[state.stageId]?.bossTime ?? 150;
  if (state.elapsed > bossTime && !state.bossSpawned) {
    state.bossSpawned = true;
    addEnemy(true, false, false, "boss");
  }
}

function spawnStageMidBosses() {
  if (DIFFICULTIES[state.difficultyId]?.midBosses === false) return;
  const times = STAGES[state.stageId]?.midBossTimes || [];
  for (const time of times) {
    if (state.elapsed < time || state.midBossSpawned[time]) continue;
    state.midBossSpawned[time] = true;
    addEnemy(false, false, false, "mid");
  }
}

function addEnemy(boss, shooter, bomber = false, role = "") {
  const edge = Math.floor(Math.random() * 4);
  const pos = [
    { x: -WORLD.half, z: randomEdge() },
    { x: WORLD.half, z: randomEdge() },
    { x: randomEdge(), z: -WORLD.half },
    { x: randomEdge(), z: WORLD.half },
  ][edge];
  const scale = 1 + state.elapsed / 155;
  const redXp = 5 + Math.floor(scale * 2);
  const castleShield = role === "castleShield";
  const enemyType = castleShield ? "castleShield" : state.stageId === "stage3" && !boss && !bomber && !role ? (shooter ? "castleArbalest" : "castleSoldier") : "";
  const enemy = {
    id: crypto.randomUUID(),
    x: pos.x,
    z: pos.z,
    radius: boss ? 2.2 : role === "mid" ? 1.55 : castleShield ? 1.12 : shooter ? 1.05 : bomber ? 0.82 : 0.72 + Math.random() * 0.28,
    hp: boss ? (state.stageId === "stage3" ? 11600 : state.stageId === "stage2" ? 2900 : 1960) : role === "mid" ? (state.stageId === "stage3" ? 980 : 720) * scale : castleShield ? 112 * scale : shooter ? 46 * scale : bomber ? 34 * scale : 28 * scale,
    maxHp: boss ? (state.stageId === "stage3" ? 11600 : state.stageId === "stage2" ? 2900 : 1960) : role === "mid" ? (state.stageId === "stage3" ? 980 : 720) * scale : castleShield ? 112 * scale : shooter ? 46 * scale : bomber ? 34 * scale : 28 * scale,
    speed: boss ? 2.15 : role === "mid" ? 2.65 : castleShield ? 2.35 + state.elapsed * 0.004 : shooter ? 2.1 + state.elapsed * 0.006 : bomber ? 4.5 + state.elapsed * 0.008 : 2.8 + Math.random() * 1.7 + state.elapsed * 0.005,
    damage: boss ? 24 : role === "mid" ? 18 : castleShield ? 12 : shooter ? 12 : bomber ? 40 : 9,
    touchTimer: 0,
    shotTimer: shooter ? (1.2 + Math.random() * 1.4) * 1.5 : 0,
    xp: boss ? 120 : role === "mid" ? 65 : castleShield ? redXp * 2 : shooter ? redXp * 3 : bomber ? redXp * 6 : redXp,
    walkSeed: Math.random() * Math.PI * 2,
    boss,
    shooter,
    bomber,
    enemyType,
    midBoss: role === "mid",
    bossRole: boss ? (state.stageId === "stage3" ? "castleDragon" : state.stageId === "stage2" ? "crystalGolem" : "forestTree") : role === "mid" && state.stageId === "stage3" ? "castleGuard" : role === "mid" && state.stageId === "stage2" ? "crystalMid" : role === "mid" && state.stageId === "stage1" ? "forestTreeMid" : role,
    bossAttackTimer: role === "mid" ? 2.4 : boss ? 2.8 : 0,
    bossShotTimer: boss && (state.stageId === "stage2" || state.stageId === "stage3") ? 3.6 : 0,
  };
  if (enemy.bossRole === "castleDragon") {
    enemy.x = 0;
    enemy.z = 0;
    enemy.radius = 3.2;
    enemy.damage = 34;
    enemy.dragonHomeIndex = 0;
  }
  enemy.mesh = makeEnemyMesh(enemy);
  scene.add(enemy.mesh);
  state.enemies.push(enemy);
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    const target = nearestLivingPlayer(enemy);
    if (!target) continue;
    const angle = Math.atan2(target.x - enemy.x, target.z - enemy.z);
    const keepDistance = enemy.shooter && distance(enemy, target) < 10;
    const dir = keepDistance ? -1 : 1;
    const slow = state.elapsed < (enemy.slowUntil || 0) ? 0.48 : 1;
    if (enemy.bossRole !== "castleDragon") {
      enemy.x += Math.sin(angle) * enemy.speed * slow * dir * dt;
      enemy.z += Math.cos(angle) * enemy.speed * slow * dir * dt;
    }
    enemy.touchTimer -= dt;
    if (enemy.bossRole === "castleDragon") {
      updateDragonVisual(enemy, target, dt);
    } else if (enemy.enemyType?.startsWith("castle")) {
      const bob = Math.sin(state.elapsed * 8.5 + (enemy.walkSeed || 0)) * 0.08;
      enemy.mesh.position.set(enemy.x, enemy.radius + bob, enemy.z);
      enemy.mesh.rotation.y = angle + (keepDistance ? Math.PI : 0);
    } else {
      enemy.mesh.position.set(enemy.x, enemy.radius, enemy.z);
      enemy.mesh.rotation.y += dt * (enemy.boss ? 1.2 : 2.6);
    }

    if (enemy.boss || enemy.midBoss) updateBossEnemy(enemy, target, dt);
    updateBossHealthVisual(enemy);

    if (enemy.shooter) {
      enemy.shotTimer -= dt * slow;
      if (enemy.shotTimer <= 0) {
        shootEnemyBullet(enemy, target);
        enemy.shotTimer = (1.65 + Math.random() * 0.7) * 1.5;
      }
    }

    if (enemy.bomber && distance(enemy, target) < enemy.radius + target.radius + 1.05) {
      explodeBomber(enemy);
      continue;
    }

    if (distance(enemy, target) < enemy.radius + target.radius && enemy.touchTimer <= 0) {
      damagePlayer(target, bossScaledDamage(enemy, enemy.damage));
      enemy.touchTimer = 0.55;
      addRing(target.x, target.z, 1.6, 0xd95f59);
    }
  }

  const dead = state.enemies.filter((enemy) => enemy.hp <= 0);
  for (const enemy of dead) {
    state.kills += 1;
    const owner = state.players.find((p) => p.id === enemy.lastHitBy) || localPlayer();
    dropGem(enemy.x, enemy.z, enemy.xp, enemy.boss || enemy.midBoss ? "boss" : enemy.bomber || enemy.enemyType === "castleShield" ? "bomber" : enemy.shooter ? "shooter" : "normal");
    if (owner) {
      owner.hp = Math.min(owner.maxHp, owner.hp + owner.lifeSteal);
    }
    if (enemy.midBoss) spawnHeartAt(enemy.x, enemy.z);
    addRing(enemy.x, enemy.z, enemy.boss ? 3.2 : enemy.bomber ? 2.2 : 1.4, enemy.bomber ? 0xffd84a : enemy.shooter ? 0x3fb7d6 : enemy.boss ? 0x57c4a7 : 0xf2c14e);
  }
  removeDead(state.enemies, (enemy) => enemy.hp <= 0);
}

function updateBossEnemy(enemy, target, dt) {
  enemy.bossAttackTimer -= dt;
  if (enemy.bossAttackTimer <= 0) {
    if (enemy.bossRole === "castleDragon") {
      moveDragonPerch(enemy);
      enemy.dragonPattern = ((enemy.dragonPattern || 0) + 1) % 3;
      if (enemy.dragonPattern === 0) {
        addDragonBreath(enemy, target);
      } else if (enemy.dragonPattern === 1) {
        addDragonTailSweep(enemy);
      } else {
        addDragonFireRain(enemy);
      }
      enemy.bossAttackTimer = bossAttackCooldown(enemy, 4.8);
    } else if (enemy.bossRole === "crystalGolem") {
      enemy.bossPattern = ((enemy.bossPattern || 0) + 1) % 2;
      if (enemy.bossPattern === 0) {
        spawnCrystalDropsForPlayers(enemy, { radius: 3.25, damage: 40 });
      } else {
        const firstCharge = addBossChargeLine(enemy, target);
        if (bossRagePhase(enemy) !== "normal") addBossChargeLine(enemy, target, firstCharge.start + 0.18, { x: firstCharge.endX, z: firstCharge.endZ }, { retargetOnStart: true });
      }
      enemy.bossAttackTimer = bossAttackCooldown(enemy, 5.2);
    } else if (enemy.bossRole === "crystalMid") {
      spawnCrystalDropsForPlayers(enemy, { radius: 3.05, damage: 40 });
      enemy.bossAttackTimer = bossAttackCooldown(enemy, 5.4);
    } else if (enemy.bossRole === "forestTree" || enemy.bossRole === "forestTreeMid") {
      addRootZonesForPlayers(enemy);
      enemy.bossAttackTimer = bossAttackCooldown(enemy, enemy.boss ? 4.6 : 5.3);
    } else if (enemy.bossRole === "royalGuard" || enemy.bossRole === "castleGuard") {
      addCastleStrikeZonesForPlayers(enemy);
      enemy.bossAttackTimer = bossAttackCooldown(enemy, enemy.boss ? 4.5 : 5.2);
    } else {
      const radius = enemy.boss ? 4.2 : 3.2;
      const damage = enemy.boss ? 32 : 22;
      addBossZone(target.x, target.z, radius, bossScaledDamage(enemy, damage), enemy.id, enemy.bossRole);
      enemy.bossAttackTimer = bossAttackCooldown(enemy, enemy.boss ? 4.8 : 5.6);
    }
  }
  if (enemy.bossRole === "crystalGolem") {
    enemy.bossShotTimer -= dt;
    if (enemy.bossShotTimer <= 0) {
      shootBossRadial(enemy, bossProjectileCount(enemy, 10, 15, 20));
      enemy.bossShotTimer = bossAttackCooldown(enemy, 3.8);
    }
  } else if (enemy.bossRole === "forestTree") {
    enemy.bossShotTimer -= dt;
    if (enemy.bossShotTimer <= 0) {
      shootForestSeeds(enemy, bossProjectileCount(enemy, 8, 16, 24));
      enemy.bossShotTimer = bossAttackCooldown(enemy, 4.4);
    }
  } else if (enemy.bossRole === "royalGuard") {
    enemy.bossShotTimer -= dt;
    if (enemy.bossShotTimer <= 0) {
      shootBossRadial(enemy, bossProjectileCount(enemy, 8, 12, 18));
      enemy.bossShotTimer = bossAttackCooldown(enemy, 4.0);
    }
  }
}

function bossAttackCooldown(enemy, baseSeconds) {
  return baseSeconds / bossAttackSpeedMultiplier(enemy);
}

function bossAttackSpeedMultiplier(enemy) {
  const phase = bossRagePhase(enemy);
  if (phase === "critical") return 1.5;
  if (phase === "angry") return 1.25;
  return 1;
}

function bossProjectileCount(enemy, normal, angry, critical) {
  const phase = bossRagePhase(enemy);
  if (phase === "critical") return critical;
  if (phase === "angry") return angry;
  return normal;
}

function bossRagePhase(enemy) {
  return state.difficultyId === "normal" ? bossAttackPhase(enemy) : "normal";
}

function bossAttackPhase(enemy) {
  if (!enemy?.maxHp) return "normal";
  const ratio = enemy.hp / enemy.maxHp;
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "angry";
  return "normal";
}

function bossScaledDamage(enemy, baseDamage) {
  return baseDamage * (enemy?.boss || enemy?.midBoss ? bossAttackSpeedMultiplier(enemy) : 1);
}

function spawnCrystalDropsForPlayers(enemy, options = {}) {
  const damage = bossScaledDamage(enemy, options.damage || 40);
  for (const player of livingPlayers()) {
    spawnRockfallAt(player.x, player.z, { radius: options.radius || 3.05, damage, enemyDamage: 0, hurtsEnemies: false, crystal: true, life: 2.05, impactAt: 1.05 });
  }
}

function addRootZonesForPlayers(enemy) {
  const radius = enemy.boss ? 4.4 : 3.4;
  const damage = bossScaledDamage(enemy, enemy.boss ? 30 : 22);
  for (const player of livingPlayers()) {
    addBossZone(player.x, player.z, radius, damage, enemy.id, enemy.bossRole);
  }
}

function addCastleStrikeZonesForPlayers(enemy) {
  const radius = enemy.boss ? 4.6 : 3.5;
  const damage = bossScaledDamage(enemy, enemy.boss ? 34 : 24);
  for (const player of livingPlayers()) {
    addBossZone(player.x, player.z, radius, damage, enemy.id, enemy.bossRole);
  }
}

function moveDragonPerch(enemy) {
  const spots = [
    { x: 0, z: 0 },
    { x: -16, z: -12 },
    { x: 16, z: -12 },
    { x: -16, z: 13 },
    { x: 16, z: 13 },
  ];
  enemy.dragonHomeIndex = ((enemy.dragonHomeIndex || 0) + 1) % spots.length;
  const spot = spots[enemy.dragonHomeIndex];
  enemy.x = spot.x;
  enemy.z = spot.z;
  addRing(enemy.x, enemy.z, 3.8, 0xff6b2c);
}

function addDragonBreath(enemy, target) {
  const angle = Math.atan2(target.x - enemy.x, target.z - enemy.z);
  const length = 30;
  const line = {
    id: crypto.randomUUID(),
    kind: "breath",
    x: enemy.x,
    z: enemy.z,
    endX: clamp(enemy.x + Math.sin(angle) * length, -WORLD.half + 2, WORLD.half - 2),
    endZ: clamp(enemy.z + Math.cos(angle) * length, -WORLD.half + 2, WORLD.half - 2),
    angle,
    width: 6.8,
    length,
    damage: bossScaledDamage(enemy, 46),
    owner: enemy.id,
    role: enemy.bossRole,
    life: 2.15,
    start: 2.15,
    impactAt: 1.18,
    chargeDuration: 0.65,
    impacted: false,
    mesh: makeBossZoneMesh({ kind: "breath", width: 6.8, length, role: enemy.bossRole }),
  };
  scene.add(line.mesh);
  state.bossZones.push(line);
}

function addDragonTailSweep(enemy) {
  addBossZone(enemy.x, enemy.z, 9.2, bossScaledDamage(enemy, 40), enemy.id, enemy.bossRole, "tail");
}

function addDragonFireRain(enemy) {
  for (const player of livingPlayers()) {
    spawnRockfallAt(player.x, player.z, { radius: 3.4, damage: bossScaledDamage(enemy, 38), enemyDamage: 0, hurtsEnemies: false, life: 2.0, impactAt: 1.0, fire: true });
  }
  const extra = bossProjectileCount(enemy, 1, 2, 3);
  for (let i = 0; i < extra; i += 1) {
    spawnRockfallAt(randomFieldPoint(), randomFieldPoint(), { radius: 3.0, damage: bossScaledDamage(enemy, 32), enemyDamage: 0, hurtsEnemies: false, life: 2.1, impactAt: 1.05, fire: true });
  }
}

function addBossChargeLine(enemy, target, delay = 0, origin = null, options = {}) {
  const startX = origin?.x ?? enemy.x;
  const startZ = origin?.z ?? enemy.z;
  const angle = Math.atan2(target.x - startX, target.z - startZ);
  const length = 24;
  const endX = clamp(startX + Math.sin(angle) * length, -WORLD.half + enemy.radius, WORLD.half - enemy.radius);
  const endZ = clamp(startZ + Math.cos(angle) * length, -WORLD.half + enemy.radius, WORLD.half - enemy.radius);
  const duration = 2.05;
  const line = {
    id: crypto.randomUUID(),
    kind: "charge",
    x: startX,
    z: startZ,
    endX,
    endZ,
    angle,
    width: 2.6,
    length: Math.hypot(endX - startX, endZ - startZ),
    damage: bossScaledDamage(enemy, 38),
    owner: enemy.id,
    role: enemy.bossRole,
    delay,
    life: duration + delay,
    start: duration + delay,
    impactAt: 1.05,
    chargeDuration: 0.92,
    startX,
    startZ,
    retargetOnStart: Boolean(options.retargetOnStart),
    retargeted: false,
    impacted: false,
    mesh: makeBossZoneMesh({ kind: "charge", width: 2.6, length: Math.hypot(endX - startX, endZ - startZ), role: enemy.bossRole }),
  };
  scene.add(line.mesh);
  state.bossZones.push(line);
  return line;
}

function shootBossRadial(enemy, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + state.elapsed * 0.18;
    const bullet = {
      id: crypto.randomUUID(),
      x: enemy.x + Math.sin(angle) * 1.3,
      z: enemy.z + Math.cos(angle) * 1.3,
      vx: Math.sin(angle) * 8.5,
      vz: Math.cos(angle) * 8.5,
      radius: 0.42,
      damage: bossScaledDamage(enemy, 14),
      life: 5.2,
      kind: "crystal",
      colorIndex: i % 2,
      mesh: makeBulletMesh({ kind: "crystal", colorIndex: i % 2 }),
    };
    bullet.mesh.position.set(bullet.x, 1.05, bullet.z);
    scene.add(bullet.mesh);
    state.enemyBullets.push(bullet);
  }
}

function shootForestSeeds(enemy, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count - state.elapsed * 0.12;
    const bullet = {
      id: crypto.randomUUID(),
      x: enemy.x + Math.sin(angle) * 1.25,
      z: enemy.z + Math.cos(angle) * 1.25,
      vx: Math.sin(angle) * 7.6,
      vz: Math.cos(angle) * 7.6,
      radius: 0.4,
      damage: bossScaledDamage(enemy, 13),
      life: 5,
      kind: "seed",
      angle,
      mesh: makeBulletMesh({ kind: "seed" }),
    };
    bullet.mesh.rotation.y = angle;
    bullet.mesh.position.set(bullet.x, 1.05, bullet.z);
    scene.add(bullet.mesh);
    state.enemyBullets.push(bullet);
  }
}

function explodeBomber(enemy) {
  if (enemy.hp <= 0) return;
  enemy.hp = 0;
  sfx("bomber", { broadcast: net.mode === "host" });
  const radius = 3.1;
  addRing(enemy.x, enemy.z, radius, 0xffd84a);
  addRing(enemy.x, enemy.z, radius * 0.55, 0xffd166);
  for (const player of state.players) {
    if (player.dead || player.hp <= 0) continue;
    if (distance(enemy, player) <= radius + player.radius) damagePlayer(player, enemy.damage);
  }
  for (const other of state.enemies) {
    if (other === enemy || other.hp <= 0) continue;
    if (distance(enemy, other) <= radius + other.radius) {
      other.hp -= 42;
      other.lastHitBy = enemy.lastHitBy || nearestLivingPlayer(enemy)?.id || "";
    }
  }
}

function shootEnemyBullet(enemy, target) {
  const angle = Math.atan2(target.x - enemy.x, target.z - enemy.z);
  const bolt = enemy.enemyType === "castleArbalest";
  const bullet = {
    id: crypto.randomUUID(),
    x: enemy.x,
    z: enemy.z,
    vx: Math.sin(angle) * 11,
    vz: Math.cos(angle) * 11,
    radius: bolt ? 0.3 : 0.34,
    damage: enemy.damage * 0.5,
    life: 4,
    kind: bolt ? "bolt" : "",
    angle,
    mesh: makeBulletMesh({ kind: bolt ? "bolt" : "", angle }),
  };
  bullet.mesh.position.set(bullet.x, 1.05, bullet.z);
  scene.add(bullet.mesh);
  state.enemyBullets.push(bullet);
}

function updateEnemyBullets(dt) {
  for (const bullet of state.enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.z += bullet.vz * dt;
    bullet.life -= dt;
    bullet.mesh.position.set(bullet.x, 1.05, bullet.z);
    if (bullet.kind === "seed") {
      bullet.mesh.rotation.y = bullet.angle ?? Math.atan2(bullet.vx, bullet.vz);
      bullet.mesh.rotation.z += dt * 8;
    } else if (bullet.kind === "bolt") {
      bullet.mesh.rotation.y = bullet.angle ?? Math.atan2(bullet.vx, bullet.vz);
    } else {
      bullet.mesh.rotation.y += dt * 6;
    }
    for (const player of state.players) {
      if (!player.dead && player.hp > 0 && distance(bullet, player) < bullet.radius + player.radius) {
        damagePlayer(player, bullet.damage);
        addRing(player.x, player.z, 1.2, 0xff7a42);
        bullet.life = 0;
        break;
      }
    }
  }
  removeDead(state.enemyBullets, (b) => b.life <= 0 || Math.abs(b.x) > WORLD.half + 4 || Math.abs(b.z) > WORLD.half + 4);
}

function damagePlayer(player, damage) {
  if (player.dead || state.elapsed < (player.invincibleUntil || 0)) return;
  player.hp -= damage;
  player.hitFlash = 0.45;
  if (player.local) sfx("hit");
  if (player.hp > 0) return;
  player.hp = 0;
  player.dead = true;
  player.reviveAt = state.elapsed + 20;
  setPlayerDeadVisual(player, true);
  if (net.mode === "solo" || allPlayersDead()) endGame(false);
}

function updateRevives() {
  if (net.mode === "solo") return;
  for (const player of state.players) {
    if (player.dead && state.elapsed >= player.reviveAt && !state.won) {
      player.dead = false;
      player.hp = Math.ceil(player.maxHp / 2);
      player.invincibleUntil = state.elapsed + 2;
      player.hitFlash = 0;
      player.x = 0;
      player.z = 0;
      setPlayerDeadVisual(player, false);
      addRing(player.x, player.z, 2.4, 0x57c4a7);
      if (player.local) hideStatus();
    }
  }
}

function allPlayersDead() {
  return state.players.length > 0 && state.players.every((player) => player.dead || player.hp <= 0);
}

function updateArrows(dt) {
  for (const arrow of state.arrows) {
    arrow.x += arrow.vx * dt;
    arrow.z += arrow.vz * dt;
    arrow.life -= dt;
    arrow.mesh.position.set(arrow.x, 1.1, arrow.z);
    if (arrow.kind === "shuriken") arrow.mesh.rotation.z += dt * 18;
    for (const enemy of state.enemies) {
      if (arrow.hit.has(enemy)) continue;
      if (distance(arrow, enemy) < arrow.radius + enemy.radius) {
        const finalDamage = arrow.damage * projectileDamageMultiplier(arrow, enemy);
        enemy.hp -= finalDamage;
        enemy.lastHitBy = arrow.owner;
        arrow.hit.add(enemy);
        if (arrow.kind === "magic") sfx("fire", { broadcast: net.mode === "host" });
        const hitColor = arrow.kind === "magic" ? 0xff6b2c : arrow.kind === "flyingSlash" ? 0x91c7ff : arrow.kind === "shuriken" ? 0x2dd4bf : 0xf2c14e;
        addRing(enemy.x, enemy.z, arrow.kind === "magic" ? 1.0 : arrow.kind === "flyingSlash" ? 1.15 : arrow.kind === "shuriken" ? 0.95 : 0.8, hitColor);
        if (arrow.kind === "shuriken") {
          const owner = state.players.find((p) => p.id === arrow.owner);
          if (owner) applyNinjaShadowBind(owner, enemy);
        }
        if (arrow.kind === "magic" && arrow.splash > 0) {
          const splashRadius = 1.4 + arrow.splash * 0.42;
          const splashDamage = arrow.damage * (0.35 + arrow.splash * 0.14);
          magicExplosion(enemy.x, enemy.z, splashRadius, splashDamage, arrow.chain || 0, arrow.owner, new Set([enemy.id || enemy]));
        }
        if (arrow.pierce <= 0) {
          arrow.life = 0;
          break;
        }
        arrow.pierce -= 1;
      }
    }
  }
  removeDead(state.arrows, (a) => a.life <= 0 || Math.abs(a.x) > WORLD.half + 4 || Math.abs(a.z) > WORLD.half + 4);
}

function projectileDamageMultiplier(projectile, target) {
  if (projectile.kind !== "arrow") return 1;
  const owner = state.players.find((player) => player.id === projectile.owner);
  if (owner?.character !== "archer") return 1;
  const traveled = Math.hypot(target.x - (projectile.startX ?? projectile.x), target.z - (projectile.startZ ?? projectile.z));
  if (traveled >= 14) return 1.4;
  if (traveled >= 8) return 1.2;
  return 1;
}

function dropGem(x, z, value, kind = "normal") {
  const gem = { id: crypto.randomUUID(), x, z, value, kind, radius: 0.42, wobble: Math.random() * Math.PI * 2, mesh: makeGemMesh({ kind }) };
  gem.mesh.position.set(x, 0.55, z);
  scene.add(gem.mesh);
  state.gems.push(gem);
}

function updateGems(dt) {
  for (const gem of state.gems) {
    const player = gem.forceTarget ? state.players.find((p) => p.id === gem.forceTarget && !p.dead && p.hp > 0) || nearestGemPlayer(gem) : nearestGemPlayer(gem);
    if (!player) continue;
    const d = distance(gem, player);
    if (gem.forceTarget || d < player.magnet) {
      const angle = Math.atan2(player.x - gem.x, player.z - gem.z);
      const speed = gem.forceTarget ? 34 : 7 + (1 - d / player.magnet) * 16;
      gem.x += Math.sin(angle) * speed * dt;
      gem.z += Math.cos(angle) * speed * dt;
    }
    gem.mesh.position.set(gem.x, 0.55 + Math.sin(state.elapsed * 5 + gem.wobble) * 0.18, gem.z);
    gem.mesh.rotation.y += dt * 2.8;
    gem.mesh.rotation.x += dt * 1.4;
    if (d < player.radius + gem.radius) {
      player.xp += gem.kind === "boss" ? player.xpNext : gem.value;
      gem.collected = true;
      if (player.local || net.mode === "host") sfx("gem", { broadcast: net.mode === "host" });
      while (player.xp >= player.xpNext) {
        player.xp -= player.xpNext;
        player.level += 1;
        player.xpNext = Math.floor(player.xpNext * 1.28 + 7);
        if (player.character === "saber") addAttackSpeed(player, 0.1);
        if (player.local || net.mode === "host") sfx("level", { broadcast: net.mode === "host" });
        openLevelUp(player);
      }
    }
  }
  removeDead(state.gems, (gem) => gem.collected);
}

function spawnHeart() {
  spawnHeartAt(randomEdge() * 0.88, randomEdge() * 0.88);
}

function spawnHeartAt(x, z) {
  const heart = {
    id: crypto.randomUUID(),
    x: clamp(x, -WORLD.half + 2, WORLD.half - 2),
    z: clamp(z, -WORLD.half + 2, WORLD.half - 2),
    heal: 60,
    radius: 0.62,
    wobble: Math.random() * Math.PI * 2,
    mesh: makeHeartMesh(),
  };
  heart.mesh.position.set(heart.x, 0.68, heart.z);
  scene.add(heart.mesh);
  state.hearts.push(heart);
}

function updateHearts(dt) {
  state.heartTimer -= dt;
  if (state.heartTimer <= 0) {
    spawnHeart();
    state.heartTimer = 12 + Math.random() * 18;
  }
  for (const heart of state.hearts) {
    heart.mesh.position.set(heart.x, 0.7 + Math.sin(state.elapsed * 4 + heart.wobble) * 0.16, heart.z);
    heart.mesh.rotation.y += dt * 1.8;
    for (const player of state.players) {
      if (player.dead || player.hp <= 0) continue;
      if (distance(heart, player) < heart.radius + player.radius) {
        player.hp = Math.min(player.maxHp, player.hp + heart.heal);
        heart.collected = true;
        if (player.local || net.mode === "host") sfx("heal", { broadcast: net.mode === "host" });
        addRing(player.x, player.z, 1.8, 0xff4f7b);
        break;
      }
    }
  }
  removeDead(state.hearts, (heart) => heart.collected);
}

function spawnMagnet() {
  const magnet = {
    id: crypto.randomUUID(),
    x: clamp(randomEdge() * 0.88, -WORLD.half + 2, WORLD.half - 2),
    z: clamp(randomEdge() * 0.88, -WORLD.half + 2, WORLD.half - 2),
    radius: 0.62,
    wobble: Math.random() * Math.PI * 2,
    mesh: makeMagnetMesh(),
  };
  magnet.mesh.position.set(magnet.x, 0.76, magnet.z);
  scene.add(magnet.mesh);
  state.magnets.push(magnet);
}

function updateMagnets(dt) {
  state.magnetTimer -= dt;
  if (state.magnetTimer <= 0) {
    spawnMagnet();
    state.magnetTimer = 36 + Math.random() * 54;
  }
  for (const magnet of state.magnets) {
    magnet.mesh.position.set(magnet.x, 0.76 + Math.sin(state.elapsed * 4 + magnet.wobble) * 0.16, magnet.z);
    magnet.mesh.rotation.y += dt * 1.8;
    for (const player of state.players) {
      if (player.dead || player.hp <= 0) continue;
      if (distance(magnet, player) < magnet.radius + player.radius) {
        magnet.collected = true;
        for (const gem of state.gems) gem.forceTarget = player.id;
        if (player.local || net.mode === "host") sfx("gem", { broadcast: net.mode === "host" });
        addRing(player.x, player.z, 2.6, 0x5aa7ff);
        showToast(`${player.name}が磁石を拾いました`);
        break;
      }
    }
  }
  removeDead(state.magnets, (magnet) => magnet.collected);
}

function updateStageHazards(dt) {
  if (!STAGES[state.stageId]?.rockfalls) {
    updateRockfalls(dt, false);
    return;
  }
  state.rockfallTimer -= dt;
  if (state.rockfallTimer <= 0) {
    const count = Math.min(8, Math.max(1, Math.floor(state.elapsed / 30)));
    for (let i = 0; i < count; i += 1) spawnRockfall();
    state.rockfallTimer = 7;
  }
  updateRockfalls(dt, true);
}

function spawnRockfall() {
  spawnRockfallAt(randomFieldPoint(), randomFieldPoint());
}

function spawnRockfallAt(x, z, options = {}) {
  const radius = options.radius || 2.65;
  const life = options.life || 2.25;
  const rockfall = {
    id: crypto.randomUUID(),
    x: clamp(x, -WORLD.half + radius, WORLD.half - radius),
    z: clamp(z, -WORLD.half + radius, WORLD.half - radius),
    radius,
    life,
    start: life,
    impactAt: options.impactAt || 1.12,
    damage: options.damage || 34,
    enemyDamage: options.enemyDamage ?? 140,
    hurtsEnemies: options.hurtsEnemies !== false,
    crystal: Boolean(options.crystal),
    fire: Boolean(options.fire),
    impacted: false,
    mesh: makeRockfallMesh({ radius, crystal: Boolean(options.crystal), fire: Boolean(options.fire) }),
  };
  scene.add(rockfall.mesh);
  state.rockfalls.push(rockfall);
}

function randomFieldPoint() {
  return -WORLD.half + 4 + Math.random() * (WORLD.half * 2 - 8);
}

function updateRockfalls(dt, applyDamage) {
  for (const rockfall of state.rockfalls) {
    rockfall.life -= dt;
    const elapsed = rockfall.start - rockfall.life;
    const falling = elapsed >= rockfall.impactAt;
    updateRockfallMesh(rockfall, elapsed);
    if (!applyDamage || rockfall.impacted || !falling) continue;
    rockfall.impacted = true;
    sfx("rock", { broadcast: net.mode === "host" });
    addRing(rockfall.x, rockfall.z, rockfall.radius, rockfall.fire ? 0xffb020 : 0xff7a42);
    for (const player of state.players) {
      if (player.dead || player.hp <= 0) continue;
      if (distance(rockfall, player) <= rockfall.radius + player.radius) damagePlayer(player, rockfall.damage);
    }
    if (rockfall.hurtsEnemies) {
      for (const enemy of state.enemies) {
    if (isGolemEnemy(enemy)) continue;
        if (distance(rockfall, enemy) > rockfall.radius + enemy.radius) continue;
        enemy.hp -= rockfall.enemyDamage;
        const owner = nearestLivingPlayer(enemy);
        if (owner) enemy.lastHitBy = owner.id;
      }
    }
  }
  removeDead(state.rockfalls, (rockfall) => rockfall.life <= 0);
}

function isGolemEnemy(enemy) {
  return enemy.bossRole === "crystalGolem" || enemy.bossRole === "crystalMid";
}

function isForestBossRole(role) {
  return role === "forestTree" || role === "forestTreeMid";
}

function isCastleBossRole(role) {
  return role === "royalGuard" || role === "castleGuard" || role === "castleDragon";
}

function addBossZone(x, z, radius, damage, owner = "", role = "", kind = "") {
  const zone = {
    id: crypto.randomUUID(),
    kind,
    x: clamp(x, -WORLD.half + radius, WORLD.half - radius),
    z: clamp(z, -WORLD.half + radius, WORLD.half - radius),
    radius,
    damage,
    owner,
    role,
    life: 1.65,
    start: 1.65,
    impactAt: 1.0,
    impacted: false,
    mesh: makeBossZoneMesh({ radius, role, kind }),
  };
  scene.add(zone.mesh);
  state.bossZones.push(zone);
}

function updateBossZones(dt) {
  for (const zone of state.bossZones) {
    zone.life -= dt;
    const elapsed = zone.start - zone.life;
    const zoneElapsed = Math.max(0, elapsed - (zone.delay || 0));
    if (zone.delay && elapsed < zone.delay) {
      if (zone.mesh) zone.mesh.visible = false;
      continue;
    }
    if (zone.mesh) zone.mesh.visible = true;
    if (zone.kind === "charge" && zone.retargetOnStart && !zone.retargeted) retargetBossCharge(zone);
    updateBossZoneMesh(zone, zoneElapsed);
    if (zone.kind === "charge" && zone.impacted) updateBossChargeMotion(zone, zoneElapsed);
    if (zone.impacted || zoneElapsed < zone.impactAt) continue;
    zone.impacted = true;
    if (zone.kind === "charge") {
      resolveBossChargeDamage(zone);
      updateBossChargeMotion(zone, zoneElapsed);
      continue;
    }
    if (zone.kind === "breath") {
      resolveDragonBreathDamage(zone);
      continue;
    }
    addRing(zone.x, zone.z, zone.radius, isCastleBossRole(zone.role) ? 0xfacc15 : isForestBossRole(zone.role) ? 0x8bdc65 : zone.role === "crystalGolem" ? 0xa78bfa : 0xff5f5f);
    for (const player of state.players) {
      if (player.dead || player.hp <= 0) continue;
      if (distance(zone, player) <= zone.radius + player.radius) damagePlayer(player, zone.damage);
    }
  }
  removeDead(state.bossZones, (zone) => zone.life <= 0);
}

function retargetBossCharge(zone) {
  const boss = state.enemies.find((enemy) => enemy.id === zone.owner);
  const target = boss ? nearestLivingPlayer(boss) : null;
  if (!boss || !target) {
    zone.retargeted = true;
    return;
  }
  const startX = boss.x;
  const startZ = boss.z;
  const angle = Math.atan2(target.x - startX, target.z - startZ);
  const length = 24;
  const endX = clamp(startX + Math.sin(angle) * length, -WORLD.half + boss.radius, WORLD.half - boss.radius);
  const endZ = clamp(startZ + Math.cos(angle) * length, -WORLD.half + boss.radius, WORLD.half - boss.radius);
  zone.x = startX;
  zone.z = startZ;
  zone.startX = startX;
  zone.startZ = startZ;
  zone.endX = endX;
  zone.endZ = endZ;
  zone.angle = angle;
  zone.length = Math.hypot(endX - startX, endZ - startZ);
  zone.retargeted = true;
  if (zone.mesh) {
    scene.remove(zone.mesh);
    zone.mesh = makeBossZoneMesh({ kind: "charge", width: zone.width, length: zone.length, role: zone.role });
    scene.add(zone.mesh);
  }
}

function resolveBossChargeDamage(zone) {
  addRing(zone.endX, zone.endZ, 2.6, 0xa78bfa);
  for (const player of state.players) {
    if (player.dead || player.hp <= 0) continue;
    if (distancePointToSegment(player.x, player.z, zone.x, zone.z, zone.endX, zone.endZ) <= zone.width * 0.5 + player.radius) {
      damagePlayer(player, zone.damage);
    }
  }
}

function resolveDragonBreathDamage(zone) {
  addRing(zone.endX, zone.endZ, 3.2, 0xff6b2c);
  for (const player of state.players) {
    if (player.dead || player.hp <= 0) continue;
    if (distancePointToSegment(player.x, player.z, zone.x, zone.z, zone.endX, zone.endZ) <= zone.width * 0.5 + player.radius) {
      damagePlayer(player, zone.damage);
    }
  }
}

function updateBossChargeMotion(zone, elapsed) {
  const boss = state.enemies.find((enemy) => enemy.id === zone.owner);
  if (!boss) return;
  const t = clamp((elapsed - zone.impactAt) / (zone.chargeDuration || 0.55), 0, 1);
  const eased = 1 - Math.pow(1 - t, 2);
  boss.x = THREE.MathUtils.lerp(zone.startX ?? zone.x, zone.endX, eased);
  boss.z = THREE.MathUtils.lerp(zone.startZ ?? zone.z, zone.endZ, eased);
  boss.mesh.position.set(boss.x, boss.radius, boss.z);
  boss.mesh.rotation.y = zone.angle || boss.mesh.rotation.y;
}

function distancePointToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const lenSq = abx * abx + abz * abz || 1;
  const t = clamp(((px - ax) * abx + (pz - az) * abz) / lenSq, 0, 1);
  const x = ax + abx * t;
  const z = az + abz * t;
  return Math.hypot(px - x, pz - z);
}

function makeBossZoneMesh(zone = {}) {
  if (zone.kind === "breath") return makeDragonBreathMesh(zone);
  if (zone.kind === "charge") return makeBossChargeMesh(zone);
  if (isForestBossRole(zone.role)) return makeForestRootZoneMesh(zone);
  const radius = zone.radius || 3.2;
  const color = isCastleBossRole(zone.role) ? 0xfacc15 : isForestBossRole(zone.role) ? 0x8bdc65 : zone.role === "crystalGolem" ? 0xa78bfa : 0xff3b66;
  const group = new THREE.Group();
  const warning = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.045, 48), materials.bossWarning.clone());
  warning.material.color.setHex(color);
  warning.position.y = 0.065;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.72, radius, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(warning, ring);
  group.userData.warning = warning;
  group.userData.ring = ring;
  group.position.set(zone.x || 0, 0, zone.z || 0);
  return group;
}

function makeDragonBreathMesh(zone = {}) {
  const length = zone.length || 28;
  const width = zone.width || 6.5;
  const group = new THREE.Group();
  const warning = new THREE.Mesh(new THREE.BoxGeometry(width, 0.055, length), materials.bossWarning.clone());
  warning.material.color.setHex(0xff6b2c);
  warning.position.set(0, 0.075, length / 2);
  const fire = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.065, length), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.42, depthWrite: false }));
  fire.position.set(0, 0.115, length / 2);
  const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.24, 0.075, length), new THREE.MeshBasicMaterial({ color: 0xfff0a6, transparent: true, opacity: 0.62, depthWrite: false }));
  core.position.set(0, 0.13, length / 2);
  group.add(warning, fire, core);
  group.userData.warning = warning;
  group.userData.center = fire;
  group.userData.core = core;
  return group;
}

function makeForestRootZoneMesh(zone = {}) {
  const radius = zone.radius || 3.4;
  const color = 0x8bdc65;
  const group = new THREE.Group();
  const warning = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.04, 48), materials.bossWarning.clone());
  warning.material.color.setHex(color);
  warning.position.y = 0.055;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.72, radius, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.09;
  group.add(warning, ring);
  const roots = [];
  const rootMat = materials.bark.clone();
  rootMat.transparent = true;
  rootMat.opacity = 0.95;
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + (i % 2) * 0.18;
    const length = radius * (0.62 + (i % 3) * 0.11);
    const root = new THREE.Group();
    root.rotation.y = angle;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, length, 7), rootMat.clone());
    body.rotation.x = Math.PI / 2;
    body.position.z = length / 2;
    body.position.y = 0.16;
    body.castShadow = true;
    const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 7), rootMat.clone());
    thorn.position.set(0, 0.46, length * 0.92);
    thorn.rotation.x = -0.22;
    thorn.castShadow = true;
    root.add(body, thorn);
    root.scale.z = 0.08;
    root.scale.y = 0.2;
    root.userData.body = body;
    root.userData.thorn = thorn;
    group.add(root);
    roots.push(root);
  }
  group.userData.warning = warning;
  group.userData.ring = ring;
  group.userData.roots = roots;
  group.position.set(zone.x || 0, 0, zone.z || 0);
  return group;
}

function makeBossChargeMesh(zone = {}) {
  const length = zone.length || 16;
  const width = zone.width || 2.6;
  const color = 0xff315f;
  const group = new THREE.Group();
  const warning = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, length), materials.bossWarning.clone());
  warning.material.color.setHex(color);
  warning.position.set(0, 0.075, length / 2);
  const center = new THREE.Mesh(new THREE.BoxGeometry(width * 0.24, 0.055, length), new THREE.MeshBasicMaterial({ color: 0xffd1dc, transparent: true, opacity: 0.72 }));
  center.position.set(0, 0.105, length / 2);
  group.add(warning, center);
  group.userData.warning = warning;
  group.userData.center = center;
  group.userData.syncLength = length;
  group.userData.syncWidth = width;
  return group;
}

function updateBossZoneMesh(zone, elapsed) {
  const mesh = zone.mesh;
  if (!mesh) return;
  if (zone.kind === "charge" || zone.kind === "breath") {
    mesh.position.set(zone.x, 0, zone.z);
    mesh.rotation.y = zone.angle || 0;
    const fade = zone.life < 0.35 ? zone.life / 0.35 : 1;
    const danger = clamp(elapsed / zone.impactAt, 0, 1);
    if (mesh.userData.warning) {
      mesh.userData.warning.material.opacity = (zone.impacted ? 0.12 : 0.24 + danger * 0.22) * fade;
    }
    if (mesh.userData.center) {
      mesh.userData.center.material.opacity = (zone.impacted ? 0.16 : 0.55 + danger * 0.2) * fade;
    }
    if (mesh.userData.core) {
      mesh.userData.core.material.opacity = (zone.impacted ? 0.28 : 0.46 + danger * 0.22) * fade;
    }
    return;
  }
  mesh.position.set(zone.x, 0, zone.z);
  const pulse = 0.9 + Math.sin(state.elapsed * 16) * 0.08;
  const fade = zone.life < 0.35 ? zone.life / 0.35 : 1;
  const danger = elapsed / zone.impactAt;
  if (mesh.userData.warning) {
    mesh.userData.warning.scale.setScalar(zone.impacted ? 0.18 : pulse + danger * 0.12);
    mesh.userData.warning.material.opacity = (zone.impacted ? 0.12 : 0.28 + danger * 0.18) * fade;
  }
  if (mesh.userData.ring) {
    mesh.userData.ring.rotation.z += 0.08;
    mesh.userData.ring.material.opacity = (zone.impacted ? 0.2 : 0.72) * fade;
  }
  if (mesh.userData.roots) {
    const warnGrow = clamp(danger, 0, 1) * 0.32;
    const burstGrow = zone.impacted ? clamp((elapsed - zone.impactAt) / 0.22, 0, 1) : 0;
    const grow = Math.max(warnGrow, burstGrow);
    for (const [index, root] of mesh.userData.roots.entries()) {
      const stagger = clamp(grow * 1.25 - index * 0.035, 0, 1);
      root.scale.z = 0.08 + stagger * 0.92;
      root.scale.y = 0.18 + stagger * 0.82;
      root.position.y = zone.impacted ? Math.sin(stagger * Math.PI) * 0.1 : 0;
      if (root.userData.thorn) root.userData.thorn.scale.y = 0.2 + stagger * 0.95;
    }
  }
}

function makeRockfallMesh(item = {}) {
  const radius = item.radius || 2.65;
  const group = new THREE.Group();
  const warning = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 48), materials.rockWarning.clone());
  warning.position.y = 0.05;
  group.add(warning);
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.78, radius, 48), new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.76, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.09;
  group.add(ring);
  const rock = item.fire ? makeFallingFireballMesh(radius) : item.crystal ? makeFallingCrystalMesh(radius) : new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 1), materials.rock.clone());
  rock.castShadow = true;
  rock.receiveShadow = true;
  rock.position.y = 8.5;
  rock.rotation.set(0.4, 0.6, 0.2);
  group.add(rock);
  group.userData.warning = warning;
  group.userData.ring = ring;
  group.userData.rock = rock;
  group.position.set(item.x || 0, 0, item.z || 0);
  return group;
}

function makeFallingCrystalMesh(radius = 2.65) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.38, radius * 1.75, 6), materials.violetCrystal.clone());
  core.rotation.x = Math.PI;
  core.castShadow = true;
  group.add(core);
  for (let i = 0; i < 4; i += 1) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.16, radius * 1.0, 5), (i % 2 === 0 ? materials.crystal : materials.violetCrystal).clone());
    const angle = (Math.PI * 2 * i) / 4 + 0.4;
    shard.position.set(Math.sin(angle) * radius * 0.28, radius * 0.03, Math.cos(angle) * radius * 0.28);
    shard.rotation.set(Math.PI + 0.25, angle, 0.1);
    shard.castShadow = true;
    group.add(shard);
  }
  group.scale.setScalar(1.12);
  return group;
}

function makeFallingFireballMesh(radius = 2.65) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.34, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff6b2c }));
  core.castShadow = true;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.55, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending }));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.26, radius * 1.25, 12), new THREE.MeshBasicMaterial({ color: 0xff2b1a, transparent: true, opacity: 0.58, depthWrite: false }));
  tail.position.y = radius * 0.78;
  tail.rotation.x = Math.PI;
  group.add(glow, core, tail);
  return group;
}

function updateRockfallMesh(rockfall, elapsed) {
  const mesh = rockfall.mesh;
  if (!mesh) return;
  mesh.position.set(rockfall.x, 0, rockfall.z);
  const fallT = clamp((elapsed - rockfall.impactAt) / 0.28, 0, 1);
  const pulse = 0.9 + Math.sin(state.elapsed * 12) * 0.08;
  const fade = rockfall.life < 0.5 ? rockfall.life / 0.5 : 1;
  if (mesh.userData.warning) {
    mesh.userData.warning.scale.setScalar(rockfall.impacted ? 0.15 : pulse);
    mesh.userData.warning.material.opacity = (rockfall.impacted ? 0.18 : 0.34) * fade;
  }
  if (mesh.userData.ring) {
    mesh.userData.ring.rotation.z += 0.06;
    mesh.userData.ring.material.opacity = (rockfall.impacted ? 0.28 : 0.76) * fade;
  }
  if (mesh.userData.rock) {
    mesh.userData.rock.position.y = THREE.MathUtils.lerp(8.5, 1.05, fallT);
    mesh.userData.rock.rotation.x += 0.08;
    mesh.userData.rock.rotation.y += 0.06;
    mesh.userData.rock.visible = rockfall.life > 0.45;
  }
}

function addMagicCircle(player) {
  const level = player.thunderCircle || 0;
  const radius = 3.0 + level * 0.55;
  const duration = 3.4 + level * 0.9;
  const circle = {
    id: crypto.randomUUID(),
    x: player.x,
    z: player.z,
    radius,
    life: duration,
    duration,
    tick: 0.15,
    zap: 0.02,
    owner: player.id,
    damage: witchSpellDamage(player, 0.75 + level * 0.22),
    mesh: makeMagicCircleMesh({ radius }),
  };
  circle.mesh.position.set(circle.x, 0.1, circle.z);
  scene.add(circle.mesh);
  state.magicCircles.push(circle);
  addRing(circle.x, circle.z, radius, 0x7dd3fc);
}

function updateMagicCircles(dt) {
  for (const circle of state.magicCircles) {
    circle.life -= dt;
    circle.tick -= dt;
    circle.zap -= dt;
    const pulse = 0.92 + Math.sin(state.elapsed * 9) * 0.06;
    circle.mesh.scale.setScalar(pulse);
    if (circle.zap <= 0) {
      circle.zap = 0.09;
      addThunderStorm(circle, 3);
    }
    if (circle.tick <= 0) {
      circle.tick = 0.62;
      addThunderStorm(circle, 5);
      for (const enemy of state.enemies) {
        if (distance(circle, enemy) <= circle.radius + enemy.radius) {
          enemy.hp -= circle.damage;
          enemy.lastHitBy = circle.owner;
          addThunderBolt(enemy.x, enemy.z);
          addRing(enemy.x, enemy.z, 0.85, 0xffe45c);
        }
      }
    }
  }
  removeDead(state.magicCircles, (circle) => circle.life <= 0);
}

function castIceSpikes(player) {
  const level = player.iceSpike || 0;
  const count = Math.max(1, level * 2);
  const slowDuration = 0.5 + level * 1;
  const damage = witchSpellDamage(player, 0.52 + level * 0.12);
  const radius = 0.72;
  const targets = state.enemies
    .filter((enemy) => enemy.hp > 0 && distance(player, enemy) < 18)
    .sort((a, b) => distance(player, a) - distance(player, b))
    .slice(0, count);
  for (const enemy of targets) {
    enemy.hp -= damage;
    enemy.lastHitBy = player.id;
    enemy.slowUntil = Math.max(enemy.slowUntil || 0, state.elapsed + slowDuration);
    addIceSpike(enemy.x, enemy.z, radius);
    addRing(enemy.x, enemy.z, 0.72, 0x9fe8ff);
  }
  if (targets.length) sfx("witchIceSpike", { broadcast: net.mode === "host" });
}

function addIceSpike(x, z, radius = 0.72) {
  const mesh = makeIceSpikeMesh({ radius });
  mesh.position.set(x, 0.1, z);
  scene.add(mesh);
  state.effects.push({ id: crypto.randomUUID(), kind: "ice", x, z, radius, mesh, life: 0.46, start: 0.46 });
}

function makeIceSpikeMesh(effect = {}) {
  const group = new THREE.Group();
  const radius = (effect.radius || 0.72) * 3;
  const main = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.28, 3.75, 5), materials.ice.clone());
  main.position.y = 1.88;
  main.rotation.y = Math.PI / 5;
  group.add(main);
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4 + 0.35;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.16, 2.46, 5), materials.ice.clone());
    shard.position.set(Math.cos(angle) * radius * 0.34, 1.2, Math.sin(angle) * radius * 0.34);
    shard.rotation.z = 0.28;
    shard.rotation.y = angle;
    group.add(shard);
  }
  return group;
}

function addThunderStorm(circle, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * circle.radius;
    addThunderBolt(circle.x + Math.cos(angle) * radius, circle.z + Math.sin(angle) * radius);
  }
}

function explode(x, z, radius, damage) {
  sfx("explode", { broadcast: net.mode === "host" });
  addRing(x, z, radius, 0xe8784f);
  for (const enemy of state.enemies) {
    if (distance({ x, z }, enemy) < radius + enemy.radius) enemy.hp -= damage;
  }
}

function magicExplosion(x, z, radius, damage, chainLeft = 0, owner = "", chained = new Set()) {
  sfx("explode", { broadcast: net.mode === "host" });
  addRing(x, z, radius, 0xff6b2c);
  addRing(x, z, radius * 0.55, 0xffd166);
  const nextBursts = [];
  for (const enemy of state.enemies) {
    if (distance({ x, z }, enemy) >= radius + enemy.radius) continue;
    enemy.hp -= damage;
    if (owner) enemy.lastHitBy = owner;
    const key = enemy.id || enemy;
    if (chainLeft > 0 && !chained.has(key)) {
      chained.add(key);
      nextBursts.push(enemy);
    }
  }
  if (chainLeft <= 0) return;
  for (const enemy of nextBursts) {
    magicExplosion(enemy.x, enemy.z, radius * 0.92, damage * 0.82, chainLeft - 1, owner, chained);
  }
}

function oldOpenLevelUp(player = localPlayer()) {
  if (!player || net.mode === "client") return;
  state.paused = true;
  state.pendingLevel = player.id;
  net.waitingFor = player.id;
  if (net.mode === "host") broadcast({ type: "levelWaiting", playerId: player.id });
  if (!player.local) {
    showStatus("他のプレイヤーの選択を待っています", `${player.name} が強化を選んでいます。`);
    sendToPlayer(player.id, { type: "levelOffer", playerId: player.id, choices: shuffle(upgrades).slice(0, 3).map((up) => up.name) });
    return;
  }
  showLevelChoices(player, shuffle(upgrades).slice(0, 3).map((up) => up.name));
}

function oldShowLevelChoices(player, choiceNames) {
  ui.choices.innerHTML = "";
  for (const name of choiceNames) {
    const up = upgrades.find((item) => item.name === name);
    if (!up) continue;
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.innerHTML = `<strong>${up.name}</strong><span>${up.desc}</span>`;
    button.addEventListener("click", () => chooseUpgrade(player.id, up.name));
    ui.choices.appendChild(button);
  }
  ui.levelUp.classList.remove("hidden");
}

function oldChooseUpgrade(playerId, upgradeName) {
  if (net.mode === "client") {
    sendToHost({ type: "levelChoice", id: localPlayerId, upgrade: upgradeName });
    ui.levelUp.classList.add("hidden");
    showStatus("他のプレイヤーの選択を待っています", "ホストの反映を待っています。");
    return;
  }
  const player = state.players.find((p) => p.id === playerId);
  const up = upgrades.find((item) => item.name === upgradeName);
  if (player && up) {
    up.apply(player);
    player.upgrades.push(up.name);
  }
  state.pendingLevel = null;
  state.paused = false;
  net.waitingFor = null;
  ui.levelUp.classList.add("hidden");
  hideStatus();
  if (net.mode === "host") broadcast({ type: "levelDone", playerId });
  updateUi();
  lastTime = performance.now();
}

function makeEnemyMesh(enemy) {
  if (enemy.bossRole === "crystalGolem" || enemy.bossRole === "crystalMid") return makeCrystalGolemMesh(enemy);
  if (enemy.bossRole === "forestTree" || enemy.bossRole === "forestTreeMid") return makeForestTreeBossMesh(enemy);
  if (enemy.bossRole === "castleDragon") return makeCastleDragonMesh(enemy);
  if (enemy.bossRole === "royalGuard" || enemy.bossRole === "castleGuard") return makeCastleKnightBossMesh(enemy);
  if (enemy.midBoss) return makeMidBossMesh(enemy);
  if (enemy.enemyType === "castleSoldier") return makeCastleSoldierMesh(enemy);
  if (enemy.enemyType === "castleArbalest") return makeCastleSoldierMesh(enemy, true);
  if (enemy.enemyType === "castleShield") return makeCastleShieldMesh(enemy);
  if (enemy.bomber) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(enemy.radius, 1), materials.bomber.clone());
    body.castShadow = true;
    const belly = new THREE.Mesh(new THREE.SphereGeometry(enemy.radius * 0.36, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.78 }));
    belly.position.y = enemy.radius * 0.12;
    const bomb = new THREE.Mesh(new THREE.SphereGeometry(enemy.radius * 0.34, 14, 10), new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.62, metalness: 0.08 }));
    bomb.position.set(0, enemy.radius * 0.92, 0);
    bomb.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(enemy.radius * 0.08, enemy.radius * 0.11, enemy.radius * 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x5b3a25, roughness: 0.8 }));
    cap.position.set(0, enemy.radius * 1.25, 0);
    cap.castShadow = true;
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(enemy.radius * 0.025, enemy.radius * 0.025, enemy.radius * 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 0.88 }));
    fuse.position.set(enemy.radius * 0.12, enemy.radius * 1.48, 0);
    fuse.rotation.z = -0.55;
    fuse.castShadow = true;
    const spark = new THREE.Mesh(new THREE.SphereGeometry(enemy.radius * 0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6b2c }));
    spark.position.set(enemy.radius * 0.28, enemy.radius * 1.7, 0);
    group.add(body, belly, bomb, cap, fuse, spark);
    group.position.set(enemy.x, enemy.radius, enemy.z);
    return group;
  }
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(enemy.radius, enemy.boss ? 24 : 16, enemy.boss ? 16 : 10),
    enemy.boss ? materials.boss : enemy.shooter ? materials.shooter : materials.enemy
  );
  mesh.position.set(enemy.x, enemy.radius, enemy.z);
  mesh.castShadow = true;
  return mesh;
}

function makeCastleSoldierMesh(enemy, arbalest = false) {
  const group = new THREE.Group();
  const r = enemy.radius || 0.85;
  const armorMat = new THREE.MeshStandardMaterial({ color: arbalest ? 0x536170 : 0xb9c1c9, roughness: 0.42, metalness: 0.48 });
  const darkArmor = new THREE.MeshStandardMaterial({ color: 0x29313a, roughness: 0.52, metalness: 0.35 });
  const clothMat = new THREE.MeshStandardMaterial({ color: arbalest ? 0x243f73 : 0x8f1d2c, roughness: 0.74 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.42, metalness: 0.2 });
  const woodMat = materials.mineWood.clone();

  const hips = new THREE.Mesh(new THREE.BoxGeometry(r * 0.95, r * 0.42, r * 0.8), clothMat);
  hips.position.y = -r * 0.18;
  hips.castShadow = true;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.46, r * 0.58, r * 1.22, 8), armorMat);
  torso.position.y = r * 0.42;
  torso.castShadow = true;
  const chest = new THREE.Mesh(new THREE.BoxGeometry(r * 0.82, r * 0.42, r * 0.16), goldMat);
  chest.position.set(0, r * 0.58, r * 0.48);
  chest.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(r * 0.34, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd1b28f, roughness: 0.72 }));
  head.position.y = r * 1.22;
  head.castShadow = true;
  const helm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.38, r * 0.42, r * 0.28, 10), darkArmor);
  helm.position.y = r * 1.42;
  helm.castShadow = true;
  const crest = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.42, r * 0.08), clothMat.clone());
  crest.position.y = r * 1.66;
  crest.castShadow = true;
  group.add(hips, torso, chest, head, helm, crest);

  for (const x of [-0.32, 0.32]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.14, r * 0.72, 7), darkArmor.clone());
    leg.position.set(x * r, -r * 0.72, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  if (arbalest) {
    const bow = new THREE.Group();
    const stock = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.12, r * 0.18), woodMat);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r * 0.46, r * 0.035, 8, 24, Math.PI), darkArmor.clone());
    arc.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    arc.position.z = r * 0.18;
    const string = new THREE.Mesh(new THREE.BoxGeometry(r * 0.82, r * 0.035, r * 0.035), new THREE.MeshBasicMaterial({ color: 0xd8e4ef }));
    string.position.z = r * 0.18;
    bow.add(stock, arc, string);
    bow.position.set(0, r * 0.42, r * 0.78);
    bow.castShadow = true;
    group.add(bow);
  } else {
    const shield = new THREE.Mesh(new THREE.BoxGeometry(r * 0.48, r * 0.85, r * 0.12), new THREE.MeshStandardMaterial({ color: 0x8f1d2c, roughness: 0.58, metalness: 0.08 }));
    shield.position.set(-r * 0.72, r * 0.25, r * 0.28);
    shield.rotation.z = 0.12;
    shield.castShadow = true;
    const sword = new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 1.25, r * 0.08), new THREE.MeshStandardMaterial({ color: 0xe5edf5, roughness: 0.24, metalness: 0.62 }));
    sword.position.set(r * 0.68, r * 0.34, r * 0.22);
    sword.rotation.z = -0.55;
    sword.castShadow = true;
    group.add(shield, sword);
  }

  group.position.set(enemy.x, enemy.radius, enemy.z);
  return group;
}

function makeCastleShieldMesh(enemy) {
  const group = makeCastleSoldierMesh(enemy, false);
  const r = enemy.radius || 1.1;
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x27364a, roughness: 0.52, metalness: 0.18 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.38, metalness: 0.24 });
  const shield = new THREE.Mesh(new THREE.BoxGeometry(r * 0.88, r * 1.28, r * 0.18), shieldMat);
  shield.position.set(0, r * 0.25, r * 0.74);
  shield.castShadow = true;
  const crest = new THREE.Mesh(new THREE.BoxGeometry(r * 0.18, r * 1.1, r * 0.2), rimMat);
  crest.position.set(0, r * 0.25, r * 0.86);
  crest.castShadow = true;
  const topRim = new THREE.Mesh(new THREE.BoxGeometry(r * 0.78, r * 0.12, r * 0.2), rimMat.clone());
  topRim.position.set(0, r * 0.86, r * 0.86);
  topRim.castShadow = true;
  const bottomRim = topRim.clone();
  bottomRim.position.y = -r * 0.36;
  group.add(shield, crest, topRim, bottomRim);
  group.userData.shieldEnemy = true;
  return group;
}

function makeCastleDragonMesh(enemy) {
  const group = new THREE.Group();
  const scale = enemy.radius / 3.2;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b1620, roughness: 0.58, metalness: 0.08, emissive: 0x170407 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x6f1d2d, roughness: 0.62, metalness: 0.02, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc1, roughness: 0.48, metalness: 0.08 });
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.65 * scale, 18, 12), bodyMat);
  body.scale.set(1.35, 0.86, 1.75);
  body.position.y = 1.55 * scale;
  body.castShadow = true;
  const chest = new THREE.Mesh(new THREE.SphereGeometry(1.05 * scale, 16, 10), bodyMat.clone());
  chest.scale.set(1.05, 0.9, 1.1);
  chest.position.set(0, 1.95 * scale, 1.65 * scale);
  chest.castShadow = true;
  group.add(body, chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.72 * scale, 2.2 * scale, 10), bodyMat.clone());
  neck.position.set(0, 2.38 * scale, 2.55 * scale);
  neck.rotation.x = -0.72;
  neck.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.82 * scale, 14, 10), bodyMat.clone());
  head.scale.set(1.15, 0.78, 1.05);
  head.position.set(0, 3.18 * scale, 3.42 * scale);
  head.castShadow = true;
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.92 * scale, 0.28 * scale, 0.82 * scale), bodyMat.clone());
  jaw.position.set(0, 2.95 * scale, 3.95 * scale);
  jaw.castShadow = true;
  const mouthFire = new THREE.Mesh(new THREE.ConeGeometry(0.28 * scale, 0.9 * scale, 12), fireMat);
  mouthFire.position.set(0, 2.95 * scale, 4.45 * scale);
  mouthFire.rotation.x = Math.PI / 2;
  group.add(neck, head, jaw, mouthFire);

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16 * scale, 0.78 * scale, 8), hornMat);
    horn.position.set(side * 0.42 * scale, 3.66 * scale, 3.28 * scale);
    horn.rotation.set(-0.45, 0, side * 0.28);
    horn.castShadow = true;
    const wing = makeDragonWing(scale, side, wingMat);
    wing.position.set(side * 1.05 * scale, 2.3 * scale, 0.1 * scale);
    wing.userData.side = side;
    group.add(horn, wing);
  }

  for (let i = 0; i < 6; i += 1) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, 0.55 * scale, 7), hornMat.clone());
    spike.position.set(0, (2.65 - i * 0.15) * scale, (2.0 - i * 0.78) * scale);
    spike.rotation.x = -0.45;
    spike.castShadow = true;
    group.add(spike);
  }

  for (let i = 0; i < 6; i += 1) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry((0.62 - i * 0.065) * scale, 12, 8), bodyMat.clone());
    seg.scale.set(0.9, 0.62, 1.35);
    seg.position.set(0, (1.45 - i * 0.08) * scale, (-1.9 - i * 0.76) * scale);
    seg.castShadow = true;
    group.add(seg);
  }

  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * scale, 0.32 * scale, 1.25 * scale, 8), bodyMat.clone());
      leg.position.set(side * (0.78 + i * 0.5) * scale, 0.55 * scale, (0.95 - i * 1.9) * scale);
      leg.rotation.z = side * 0.18;
      leg.castShadow = true;
      group.add(leg);
    }
  }

  group.position.set(enemy.x, enemy.radius, enemy.z);
  group.scale.setScalar(1.05);
  group.userData.dragon = true;
  return group;
}

function makeDragonWing(scale, side, material) {
  const wing = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0x2a1118, roughness: 0.62 });
  const membrane = new THREE.Mesh(new THREE.CircleGeometry(1.65 * scale, 3), material.clone());
  membrane.scale.set(1.55, 0.82, 1);
  membrane.rotation.set(Math.PI / 2, 0, side * 0.45);
  membrane.position.set(side * 1.25 * scale, 0, -0.15 * scale);
  const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.11 * scale, 2.9 * scale, 7), boneMat);
  bone.rotation.set(0.35, 0, side * 1.08);
  bone.position.set(side * 0.95 * scale, -0.08 * scale, -0.12 * scale);
  bone.castShadow = true;
  wing.add(membrane, bone);
  return wing;
}

function updateDragonVisual(enemy, target, dt) {
  const bob = Math.sin(state.elapsed * 4.2) * 0.22;
  const angle = target ? Math.atan2(target.x - enemy.x, target.z - enemy.z) : enemy.mesh.rotation.y;
  enemy.mesh.position.set(enemy.x, enemy.radius + 1.2 + bob, enemy.z);
  enemy.mesh.rotation.y = angle;
  const flap = Math.sin(state.elapsed * 9.5) * 0.42;
  for (const child of enemy.mesh.children) {
    if (child.userData?.side) child.rotation.z = child.userData.side * (0.34 + flap);
  }
}

function updateBossHealthVisual(enemy) {
  if (!enemy?.mesh || (!enemy.boss && !enemy.midBoss) || !enemy.maxHp) return;
  applyHealthAura(enemy.mesh, healthPhase(enemy.hp, enemy.maxHp), enemy.radius || 1.5);
}

function healthPhase(hp, maxHp) {
  if (!maxHp) return "";
  const ratio = clamp(hp / maxHp, 0, 1);
  if (ratio <= 0.25) return "red";
  if (ratio <= 0.5) return "orange";
  return "";
}

function applyHealthAura(mesh, phase = "", radius = 1.5) {
  if (!mesh.userData.healthAura) {
    const aura = new THREE.Group();
    const puffs = [];
    for (let i = 0; i < 16; i += 1) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + (i % 4) * 0.035, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8a22, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      puff.userData.seed = Math.random() * Math.PI * 2;
      puff.userData.angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.35;
      puff.userData.height = 0.35 + Math.random() * 1.4;
      aura.add(puff);
      puffs.push(puff);
    }
    aura.userData.puffs = puffs;
    mesh.add(aura);
    mesh.userData.healthAura = aura;
  }
  const aura = mesh.userData.healthAura;
  aura.visible = Boolean(phase);
  if (!phase) return;
  const color = phase === "red" ? 0xff2b2b : 0xff8a22;
  const angry = phase === "red";
  for (const [index, puff] of aura.userData.puffs.entries()) {
    const speed = angry ? 2.7 : 1.8;
    const t = (state.elapsed * speed + puff.userData.seed + index * 0.17) % 1;
    const swirl = puff.userData.angle + state.elapsed * (angry ? 1.15 : 0.72) + Math.sin(state.elapsed * 2 + index) * 0.12;
    const distanceFromBoss = radius * (1.08 + Math.sin(index * 1.7) * 0.12);
    puff.position.set(Math.sin(swirl) * distanceFromBoss, radius * (0.12 + puff.userData.height * t), Math.cos(swirl) * distanceFromBoss);
    const scale = (angry ? 1.25 : 1.0) * (0.65 + t * 0.85);
    puff.scale.setScalar(scale);
    puff.material.color.setHex(color);
    puff.material.opacity = (angry ? 0.58 : 0.42) * (1 - t);
  }
}

function makeMidBossMesh(enemy) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(enemy.radius, 18, 12), materials.midBoss);
  body.castShadow = true;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(enemy.radius * 0.42, enemy.radius * 0.9, 6), materials.rock);
  crown.position.y = enemy.radius * 0.95;
  crown.rotation.y = Math.PI / 6;
  crown.castShadow = true;
  group.add(body, crown);
  group.position.set(enemy.x, enemy.radius, enemy.z);
  return group;
}

function makeCrystalGolemMesh(enemy) {
  const group = new THREE.Group();
  const rockMat = materials.rock.clone();
  rockMat.color.setHex(0x3f3f46);
  const coreMat = materials.violetCrystal.clone();
  const body = new THREE.Mesh(new THREE.DodecahedronGeometry(enemy.radius * 0.95, 1), rockMat);
  body.position.y = enemy.radius * 0.2;
  body.scale.set(1.15, 1.25, 0.95);
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(enemy.radius * 0.48, 0), rockMat.clone());
  head.position.y = enemy.radius * 1.15;
  head.castShadow = true;
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(enemy.radius * 0.34), coreMat);
  core.position.set(0, enemy.radius * 0.28, enemy.radius * 0.72);
  core.castShadow = true;
  group.add(body, head, core);
  for (let i = 0; i < 5; i += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(enemy.radius * 0.16, enemy.radius * 0.95, 6), coreMat.clone());
    const angle = -0.9 + i * 0.45;
    crystal.position.set(Math.sin(angle) * enemy.radius * 0.75, enemy.radius * 1.1, Math.cos(angle) * enemy.radius * 0.34);
    crystal.rotation.z = -angle * 0.3;
    crystal.castShadow = true;
    group.add(crystal);
  }
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.DodecahedronGeometry(enemy.radius * 0.38, 0), rockMat.clone());
    arm.position.set(side * enemy.radius * 1.0, enemy.radius * 0.28, 0);
    arm.scale.set(0.8, 1.35, 0.75);
    arm.castShadow = true;
    group.add(arm);
  }
  group.position.set(enemy.x, enemy.radius * 0.72, enemy.z);
  return group;
}

function makeForestTreeBossMesh(enemy) {
  const group = new THREE.Group();
  const barkMat = materials.bark.clone();
  const leafMat = materials.darkLeaves.clone();
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x9bef7a, transparent: true, opacity: 0.48, depthWrite: false });
  const r = enemy.radius;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.48, r * 0.78, r * 2.0, 11), barkMat);
  body.position.y = 0;
  body.scale.set(1.05, 1.0, 0.86);
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.72, 1), leafMat);
  head.position.y = r * 1.12;
  head.scale.set(1.25, 0.82, 1.05);
  head.castShadow = true;
  const core = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 12, 8), glowMat);
  core.position.set(0, r * 0.18, r * 0.54);
  group.add(body, head, core);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.2, r * 1.45, 8), barkMat.clone());
    arm.position.set(side * r * 0.72, r * 0.32, 0);
    arm.rotation.z = side * 0.82;
    arm.rotation.x = 0.18;
    arm.castShadow = true;
    group.add(arm);
  }
  for (let i = 0; i < 5; i += 1) {
    const root = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.14, r * 0.95, 7), barkMat.clone());
    const angle = (Math.PI * 2 * i) / 5;
    root.position.set(Math.sin(angle) * r * 0.42, -r * 0.86, Math.cos(angle) * r * 0.42);
    root.rotation.set(Math.PI / 2, 0, -angle);
    root.castShadow = true;
    group.add(root);
  }
  group.position.set(enemy.x, 0, enemy.z);
  return group;
}

function makeCastleKnightBossMesh(enemy) {
  if (enemy.bossRole === "castleGuard") return makeFbxCastleGuardMesh(enemy);
  const group = new THREE.Group();
  const metal = materials.saberBlade.clone();
  metal.color.setHex(0xbfc7d5);
  const gold = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.42, metalness: 0.35, emissive: 0x3f2b02 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd94c5d, roughness: 0.55 });
  const r = enemy.radius;
  const body = new THREE.Mesh(new THREE.BoxGeometry(r * 1.05, r * 1.35, r * 0.72), metal);
  body.position.y = r * 0.1;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(r * 0.58, r * 0.48, r * 0.52), metal.clone());
  head.position.y = r * 0.98;
  head.castShadow = true;
  const crest = new THREE.Mesh(new THREE.BoxGeometry(r * 0.18, r * 0.75, r * 0.14), red);
  crest.position.y = r * 1.42;
  crest.castShadow = true;
  const shield = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.95, r * 0.72), gold);
  shield.position.set(-r * 0.7, r * 0.1, r * 0.12);
  shield.rotation.z = -0.1;
  shield.castShadow = true;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 1.9, r * 0.12), materials.saberBlade.clone());
  blade.position.set(r * 0.78, r * 0.05, r * 0.05);
  blade.rotation.z = -0.48;
  blade.castShadow = true;
  group.add(body, head, crest, shield, blade);
  group.position.set(enemy.x, enemy.radius, enemy.z);
  return group;
}

function makeFbxCastleGuardMesh(enemy) {
  const group = new THREE.Group();
  group.add(makeFbxMesh("knightBossBody", () => makeOldCastleKnightCore(enemy)));
  group.add(makeFbxMesh("knightBossHelmet", () => new THREE.Group()));
  group.add(makeFbxMesh("knightBossShoulders", () => new THREE.Group()));
  group.add(makeFbxMesh("knightBossSword", () => new THREE.Group()));
  const aura = new THREE.Mesh(
    new THREE.RingGeometry(enemy.radius * 0.78, enemy.radius * 1.08, 32),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.04;
  group.add(aura);
  group.position.set(enemy.x, enemy.radius * 0.05, enemy.z);
  group.scale.setScalar(1.2);
  return group;
}

function makeOldCastleKnightCore(enemy) {
  const r = enemy.radius;
  const group = new THREE.Group();
  const metal = materials.saberBlade.clone();
  metal.color.setHex(0xbfc7d5);
  const body = new THREE.Mesh(new THREE.BoxGeometry(r * 1.0, r * 1.35, r * 0.72), metal);
  body.position.y = r * 0.75;
  body.castShadow = true;
  group.add(body);
  return group;
}

function makeArrowMesh() {
  const group = new THREE.Group();
  group.add(makeFbxMesh("arrow", makeOldArrowMesh));
  addArrowVisibilityBoost(group);
  return group;
}

function addArrowVisibilityBoost(group) {
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.68, depthWrite: false });
  const trailMat = new THREE.MeshBasicMaterial({ color: 0xffc84a, transparent: true, opacity: 0.34, depthWrite: false });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.95, 10), glowMat);
  core.rotation.x = Math.PI / 2;
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.7, 12, 1, true), trailMat);
  halo.rotation.x = Math.PI / 2;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glowMat.clone());
  tip.position.z = -0.95;
  group.add(halo, core, tip);
}

function makeOldArrowMesh() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.25, 8), materials.arrow);
  body.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 12), materials.arrow);
  head.rotation.x = Math.PI / 2;
  head.position.z = -0.85;
  group.add(body, head);
  return group;
}

function makeMagicMesh() {
  const group = new THREE.Group();
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.78, 18), materials.magic);
  flame.rotation.x = Math.PI / 2;
  flame.position.z = -0.1;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff1a8 }));
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff3b18, transparent: true, opacity: 0.72 }));
  ember.position.z = 0.16;
  group.add(flame, ember, core);
  return group;
}

function makeProjectileMesh(item = {}) {
  if (item.kind === "magic") return makeMagicMesh();
  if (item.kind === "flyingSlash") return makeFlyingSlashMesh(item);
  if (item.kind === "shuriken") return makeShurikenProjectileMesh(item);
  return makeArrowMesh();
}

function makeShurikenProjectileMesh(item = {}) {
  const radius = item.radius || 0.32;
  const fuma = item.fuma || 0;
  const group = new THREE.Group();
  const star = makeShurikenMesh(radius);
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.05, radius * (1.28 + fuma * 0.08), 24),
    new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.rotation.x = Math.PI / 2;
  group.add(glow, star);
  return group;
}

function makeShurikenMesh(radius = 0.32) {
  const group = new THREE.Group();
  const mat = materials.shuriken.clone();
  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.34, radius * 0.92, 3), mat);
    blade.position.set(Math.cos((Math.PI * i) / 2) * radius * 0.34, 0, Math.sin((Math.PI * i) / 2) * radius * 0.34);
    blade.rotation.set(Math.PI / 2, 0, -(Math.PI * i) / 2);
    blade.castShadow = true;
    group.add(blade);
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, radius * 0.08, 12), mat.clone());
  core.rotation.x = Math.PI / 2;
  core.castShadow = true;
  group.add(core);
  return group;
}

function makeFlyingSlashMesh(item = {}) {
  const radius = item.radius || 0.62;
  const group = new THREE.Group();
  const blade = makeSlashArcMesh(radius * 1.55, THREE.MathUtils.degToRad(112), 0.055, 0xffffff, 0.92);
  const glow = makeSlashArcMesh(radius * 1.18, THREE.MathUtils.degToRad(96), 0.035, 0x91c7ff, 0.72);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.2, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xdfe8f3, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  blade.rotation.x = -0.08;
  glow.rotation.x = -0.08;
  group.add(blade, glow, core);
  group.scale.setScalar(Math.max(0.75, radius / 0.62));
  return group;
}

function makeBulletMesh(item = {}) {
  if (item.kind === "crystal") return makeCrystalBulletMesh(item.colorIndex || 0);
  if (item.kind === "seed") return makeSeedBulletMesh();
  if (item.kind === "bolt") return makeBoltBulletMesh();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), materials.bullet);
  mesh.castShadow = true;
  return mesh;
}

function makeBoltBulletMesh() {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.9, 7), new THREE.MeshStandardMaterial({ color: 0x8b5a35, roughness: 0.72 }));
  shaft.rotation.x = Math.PI / 2;
  shaft.castShadow = true;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xdfe8f3, roughness: 0.3, metalness: 0.55 }));
  head.rotation.x = Math.PI / 2;
  head.position.z = -0.55;
  head.castShadow = true;
  const fletchA = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.08), new THREE.MeshBasicMaterial({ color: 0x8f1d2c }));
  fletchA.position.z = 0.46;
  const fletchB = fletchA.clone();
  fletchB.rotation.z = Math.PI / 2;
  group.add(shaft, head, fletchA, fletchB);
  return group;
}

function makeSeedBulletMesh() {
  const group = new THREE.Group();
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.25, 8), materials.bark.clone());
  branch.rotation.x = Math.PI / 2;
  branch.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), materials.bark.clone());
  tip.rotation.x = Math.PI / 2;
  tip.position.z = -0.72;
  tip.castShadow = true;
  const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 6), materials.leaves.clone());
  leafA.scale.set(1.35, 0.32, 0.72);
  leafA.position.set(0.18, 0.08, 0.18);
  leafA.rotation.z = 0.62;
  const leafB = leafA.clone();
  leafB.position.set(-0.16, 0.08, -0.08);
  leafB.rotation.z = -0.72;
  group.add(branch, tip, leafA, leafB);
  return group;
}

function makeCrystalBulletMesh(colorIndex = 0) {
  const group = new THREE.Group();
  const mat = (colorIndex % 2 === 0 ? materials.crystal : materials.violetCrystal).clone();
  const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.46), mat);
  shard.scale.set(0.72, 1.35, 0.72);
  shard.rotation.x = Math.PI / 2;
  shard.castShadow = true;
  const glow = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.58),
    new THREE.MeshBasicMaterial({ color: colorIndex % 2 === 0 ? 0x7dd3fc : 0xa78bfa, transparent: true, opacity: 0.28, depthWrite: false })
  );
  glow.scale.set(0.72, 1.35, 0.72);
  glow.rotation.x = Math.PI / 2;
  group.add(shard, glow);
  return group;
}

function makeGemMesh(gem = {}) {
  const material = gem.kind === "boss" ? materials.bossGem : gem.kind === "bomber" ? materials.bomberGem : gem.kind === "shooter" ? materials.shooterGem : materials.gem;
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(gem.kind === "boss" ? 0.52 : 0.34), material);
  mesh.castShadow = true;
  return mesh;
}

function makeHeartMesh() {
  return makeFbxMesh("heart", makeOldHeartMesh);
}

function makeOldHeartMesh() {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), materials.heart);
  const right = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), materials.heart);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.62, 18), materials.heart);
  left.position.set(-0.2, 0.12, 0);
  right.position.set(0.2, 0.12, 0);
  tip.position.set(0, -0.22, 0);
  tip.rotation.z = Math.PI;
  group.add(left, right, tip);
  group.scale.setScalar(0.95);
  return group;
}

function makeMagnetMesh() {
  const group = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xe23b3b, roughness: 0.35, metalness: 0.25, emissive: 0x3a0505 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35, metalness: 0.25, emissive: 0x06163d });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f2933, roughness: 0.5, metalness: 0.35 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.22), redMat);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.22), blueMat);
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 10, 28, Math.PI), darkMat);
  left.position.set(-0.42, 0.1, 0);
  right.position.set(0.42, 0.1, 0);
  top.position.set(0, 0.55, 0);
  top.rotation.z = Math.PI;
  const n = makeTinyTextSprite("N", "#ffffff");
  const s = makeTinyTextSprite("S", "#ffffff");
  n.position.set(-0.42, -0.28, 0.14);
  s.position.set(0.42, -0.28, 0.14);
  group.add(left, right, top, n, s);
  group.scale.setScalar(1.12);
  return group;
}

function makeTinyTextSprite(text, color = "#ffffff") {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 64;
  labelCanvas.height = 64;
  const ctx = labelCanvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "900 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 34);
  const texture = new THREE.CanvasTexture(labelCanvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(0.38, 0.38, 1);
  return sprite;
}

function makeMagicCircleMesh(circle = {}) {
  const group = new THREE.Group();
  const radius = circle.radius || 3.2;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.72 });
  const diskMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  const disk = new THREE.Mesh(new THREE.CircleGeometry(radius, 56), diskMat);
  disk.rotation.x = -Math.PI / 2;
  const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.045, 8, 72), ringMat);
  outer.rotation.x = Math.PI / 2;
  const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.58, 0.026, 8, 56), ringMat.clone());
  inner.rotation.x = Math.PI / 2;
  group.add(disk, outer, inner);
  return group;
}

function addRing(x, z, radius, color) {
  const mesh = makeRingMesh({ radius, color });
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, 0.12, z);
  scene.add(mesh);
  state.effects.push({ id: crypto.randomUUID(), kind: "ring", x, z, radius, color, mesh, life: 0.28, start: 0.28 });
}

function makeRingMesh(effect) {
  const material = materials.ring.clone();
  material.color.setHex(effect.color || 0xf2c14e);
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(effect.radius || 1, 0.035, 8, 48), material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function addThunderBolt(x, z) {
  const mesh = makeThunderBoltMesh();
  mesh.position.set(x, 0.12, z);
  scene.add(mesh);
  state.effects.push({ id: crypto.randomUUID(), kind: "thunder", x, z, mesh, life: 0.18, start: 0.18 });
  thunderSfx();
}

function makeThunderBoltMesh() {
  const points = [];
  const segments = 6;
  for (let i = 0; i <= segments; i += 1) {
    const y = 5.4 - (5.1 * i) / segments;
    const jitter = i === 0 || i === segments ? 0 : 0.32;
    points.push(new THREE.Vector3((Math.random() - 0.5) * jitter, y, (Math.random() - 0.5) * jitter));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xfff15a, transparent: true, opacity: 1 });
  return new THREE.Line(geometry, material);
}

function addSlashEffect(x, z, radius, arc, angle, color, owner = "", skill = false) {
  const mesh = makeSlashMesh({ radius, arc, color, skill });
  mesh.position.set(x, 0.18, z);
  mesh.rotation.y = angle;
  scene.add(mesh);
  const life = skill ? 0.18 : 0.34;
  state.effects.push({ id: crypto.randomUUID(), kind: "slash", owner, skill, x, z, radius, arc, angle, color, mesh, life, start: life });
}

function addNinjaCloneEffect(x, z, angle = 0) {
  const mesh = makeNinjaCloneMesh();
  mesh.position.set(x, 0.05, z);
  mesh.rotation.y = angle;
  scene.add(mesh);
  state.effects.push({ id: crypto.randomUUID(), kind: "ninjaClone", x, z, angle, mesh, life: 0.36, start: 0.36 });
}

function makeNinjaCloneMesh() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.92, 5, 10), materials.ninjaShadow.clone());
  body.position.y = 1.16;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), materials.ninjaShadow.clone());
  head.position.y = 1.92;
  const slash = makeSlashArcMesh(1.05, THREE.MathUtils.degToRad(90), 0.045, 0x2dd4bf, 0.52);
  slash.position.y = 0.72;
  group.add(body, head, slash);
  return group;
}

function makeSlashMesh(effect) {
  const radius = effect.radius || 5.2;
  const arc = effect.arc || THREE.MathUtils.degToRad(100);
  const color = effect.color || 0xdfe8f3;
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 28;
  for (let i = 0; i <= steps; i += 1) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * radius, Math.cos(a) * radius);
  }
  shape.lineTo(0, 0);
  const fanMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: effect.skill ? 0.34 : 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const fan = new THREE.Mesh(new THREE.ShapeGeometry(shape), fanMaterial);
  fan.rotation.x = -Math.PI / 2;
  group.add(fan);

  if (effect.skill) {
    const arcMesh = makeSlashArcMesh(radius, arc, 0.09, 0xffffff, 0.92);
    const glowMesh = makeSlashArcMesh(radius * 0.86, arc * 0.9, 0.035, color, 0.72);
    const innerMesh = makeSlashArcMesh(radius * 0.58, arc * 0.76, 0.025, 0xdfe8f3, 0.48);
    group.add(arcMesh, glowMesh, innerMesh);
  } else {
    const edge = makeSlashArcMesh(radius, arc, 0.075, 0xffffff, 0.95);
    const rangeLineA = makeSlashRangeLine(-arc / 2, radius, color);
    const rangeLineB = makeSlashRangeLine(arc / 2, radius, color);
    group.add(edge, rangeLineA, rangeLineB);
  }
  return group;
}

function makeSlashArcMesh(radius, arc, thickness, color, opacity) {
  const points = [];
  const steps = 30;
  for (let i = 0; i <= steps; i += 1) {
    const a = -arc / 2 + (arc * i) / steps;
    points.push(new THREE.Vector3(Math.sin(a) * radius, 0.08, Math.cos(a) * radius));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 28, thickness, 8, false), material);
}

function makeSlashRangeLine(angle, radius, color) {
  const points = [
    new THREE.Vector3(0, 0.09, 0),
    new THREE.Vector3(Math.sin(angle) * radius, 0.09, Math.cos(angle) * radius),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.64,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 1, 0.025, 6, false), material);
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.life -= dt;
    const t = 1 - effect.life / effect.start;
    effect.mesh.scale.setScalar(effect.skill ? 1 + t * 0.8 : 1);
    setEffectOpacity(effect.mesh, Math.max(0, 0.75 * (1 - t)));
  }
  removeDead(state.effects, (effect) => effect.life <= 0);
}

function setEffectOpacity(mesh, opacity) {
  mesh.traverse((node) => {
    const materials = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    for (const material of materials) {
      if (material.transparent) material.opacity = opacity;
    }
  });
}

function removeDead(list, predicate) {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (predicate(list[i])) {
      scene.remove(list[i].mesh);
      list.splice(i, 1);
    }
  }
}

function checkWin() {
  const duration = STAGES[state.stageId]?.duration ?? 180;
  if (state.elapsed >= duration && state.bossSpawned && !state.enemies.some((enemy) => enemy.boss)) endGame(true);
}

function oldEndGame(won) {
  state.running = false;
  state.won = won;
  net.phase = "gameover";
  ui.endTitle.textContent = won ? "Clear!" : "Game Over";
  ui.endText.textContent = endSummaryText(state.elapsed, state.kills, true);
  ui.restartButton.textContent = net.mode === "solo" ? "コンティニュー" : "コンティニューに投票";
  ui.disbandButton.textContent = net.mode === "solo" ? "タイトルに戻る" : "解散する";
  ui.disbandButton.classList.remove("hidden");
  ui.gameOver.classList.remove("hidden");
  if (net.mode === "host") broadcast({ type: "gameOver", won, elapsed: state.elapsed, kills: state.kills });
}

function render() {
  renderer.render(scene, camera);
}

function initAudio() {
  if (!audio.enabled) return;
  if (audio.loaded) return;
  for (const [key, file] of Object.entries(AUDIO_FILES)) {
    audio.sounds[key] = new Audio(`./Sounds/${file}`);
    audio.sounds[key].preload = "auto";
    audio.sounds[key].addEventListener("error", () => console.warn(`Sound load failed: ${file}`));
    audio.sounds[key].load();
  }
  audio.loaded = true;
}

function startBgm() {
  initAudio();
  const bgmFile = state?.stageId === "stage3" ? "stage3.mp3" : state?.stageId === "stage2" ? "stage2.mp3" : "gamebgm.mp3";
  if (!audio.bgm || audio.bgmFile !== bgmFile) {
    if (audio.bgm) {
      audio.bgm.pause();
      audio.bgm.src = "";
      audio.bgm.load();
    }
    if (audio.bgmTimer) clearInterval(audio.bgmTimer);
    audio.bgm = new Audio(`./Sounds/${bgmFile}`);
    audio.bgmFile = bgmFile;
    audio.bgm.addEventListener("error", () => console.warn(`BGM load failed: ${bgmFile}`));
    audio.bgmLoopGap = bgmFile === "stage2.mp3" ? 4.25 : 0;
    audio.bgm.loop = audio.bgmLoopGap <= 0;
  }
  if (!audio.bgm) return;
  audio.bgm.volume = effectiveBgmVolume();
  audio.bgm.currentTime = 0;
  setupSeamlessBgmLoop();
  audio.bgm.play().catch(() => {});
}

function stopBgm() {
  if (!audio.bgm) return;
  if (audio.bgmTimer) clearInterval(audio.bgmTimer);
  audio.bgmTimer = 0;
  audio.bgm.pause();
  audio.bgm.currentTime = 0;
}

function setupSeamlessBgmLoop() {
  if (audio.bgmTimer) clearInterval(audio.bgmTimer);
  audio.bgmTimer = 0;
  if (!audio.bgm || audio.bgmLoopGap <= 0) return;
  audio.bgmTimer = window.setInterval(() => {
    if (!audio.bgm || !audio.bgm.duration || audio.bgm.paused) return;
    if (audio.bgm.currentTime >= audio.bgm.duration - audio.bgmLoopGap) {
      audio.bgm.currentTime = 0;
      audio.bgm.play().catch(() => {});
    }
  }, 80);
}

function sfx(kind, options = {}) {
  playSound(kind, options);
}

function playSound(kind, options = {}) {
  initAudio();
  if (kind === "gem") kind = Math.random() < 0.5 ? "gemA" : "gemB";
  if (kind === "thunder") kind = Math.random() < 0.5 ? "thunderA" : "thunderB";
  if (kind === "rock") kind = Math.random() < 0.5 ? "rockA" : "rockB";
  const base = audio.sounds[kind];
  if (base) {
    const sound = base.cloneNode();
    const volumeBoost = 1;
    sound.volume = Math.min(1, effectiveSeVolume() * volumeBoost);
    if (kind === "victory" || kind === "gameover") {
      audio.activeSounds.add(sound);
      sound.addEventListener("ended", () => audio.activeSounds.delete(sound), { once: true });
    }
    sound.play().catch(() => {});
  }
  if (net.mode === "host" && options.broadcast && !options.remote) {
    broadcast({ type: "sound", kind });
  }
}

function stopEndSounds() {
  for (const sound of audio.activeSounds) {
    sound.pause();
    sound.currentTime = 0;
  }
  audio.activeSounds.clear();
}

function thunderSfx() {
  if (!state) return;
  const now = performance.now() / 1000;
  if (now < state.thunderSoundAt) return;
  state.thunderSoundAt = now + 0.28 + Math.random() * 0.18;
  sfx("thunder");
}

function effectiveBgmVolume() {
  return clamp(audio.masterVolume * audio.bgmVolume, 0, 1);
}

function effectiveSeVolume() {
  return clamp(audio.masterVolume * audio.seVolume, 0, 1);
}

function loadAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("vansabaAudio") || "{}");
    audio.masterVolume = Number.isFinite(saved.master) ? saved.master : audio.masterVolume;
    audio.bgmVolume = Number.isFinite(saved.bgm) ? saved.bgm : audio.bgmVolume;
    audio.seVolume = Number.isFinite(saved.se) ? saved.se : audio.seVolume;
  } catch {}
  syncVolumeControls();
  applyAudioVolumes();
}

function saveAudioSettings() {
  localStorage.setItem("vansabaAudio", JSON.stringify({
    master: audio.masterVolume,
    bgm: audio.bgmVolume,
    se: audio.seVolume,
  }));
}

function syncVolumeControls() {
  const values = [
    [ui.masterVolume, ui.masterVolumeText, audio.masterVolume],
    [ui.bgmVolume, ui.bgmVolumeText, audio.bgmVolume],
    [ui.seVolume, ui.seVolumeText, audio.seVolume],
  ];
  for (const [input, label, value] of values) {
    if (input) input.value = Math.round(value * 100);
    if (label) label.textContent = `${Math.round(value * 100)}%`;
  }
}

function applyAudioVolumes() {
  if (audio.bgm) audio.bgm.volume = effectiveBgmVolume();
}

function setVolume(kind, value) {
  const normalized = clamp(Number(value) / 100, 0, 1);
  if (kind === "master") audio.masterVolume = normalized;
  if (kind === "bgm") audio.bgmVolume = normalized;
  if (kind === "se") audio.seVolume = normalized;
  syncVolumeControls();
  applyAudioVolumes();
  saveAudioSettings();
}

function openCharacterCodex() {
  ui.characterCodex.classList.remove("hidden");
  initCodexViewer();
  selectCodexCharacter(selectedCharacter());
  if (codexViewer?.raf) cancelAnimationFrame(codexViewer.raf);
  codexViewer.raf = 0;
  animateCodex();
}

function closeCharacterCodex() {
  ui.characterCodex.classList.add("hidden");
  if (codexViewer?.raf) cancelAnimationFrame(codexViewer.raf);
  if (codexViewer) codexViewer.raf = 0;
}

function initCodexViewer() {
  if (codexViewer) {
    resizeCodexViewer();
    return;
  }
  const codexScene = new THREE.Scene();
  codexScene.background = new THREE.Color(0x101419);
  const codexCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  codexCamera.position.set(0, 2.4, 7.2);
  codexCamera.lookAt(0, 1.4, 0);
  const codexRenderer = new THREE.WebGLRenderer({ canvas: ui.codexCanvas, antialias: true, alpha: true });
  codexRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  codexScene.add(new THREE.HemisphereLight(0xe6efff, 0x1c1714, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 6, 5);
  codexScene.add(keyLight);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 48),
    new THREE.MeshBasicMaterial({ color: 0x1d252b, transparent: true, opacity: 0.88 })
  );
  floor.rotation.x = -Math.PI / 2;
  codexScene.add(floor);
  codexViewer = { scene: codexScene, camera: codexCamera, renderer: codexRenderer, model: null, character: "archer", modelMode: "current", rotation: 0, dragging: false, lastX: 0, raf: 0 };
  buildCodexCards();
  ui.codexModelToggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-model-mode]");
    if (!button) return;
    setCodexModelMode(button.dataset.modelMode);
  });
  ui.codexCanvas.addEventListener("pointerdown", (event) => {
    codexViewer.dragging = true;
    codexViewer.lastX = event.clientX;
    ui.codexCanvas.setPointerCapture(event.pointerId);
  });
  ui.codexCanvas.addEventListener("pointermove", (event) => {
    if (!codexViewer.dragging) return;
    codexViewer.rotation += (event.clientX - codexViewer.lastX) * 0.012;
    codexViewer.lastX = event.clientX;
  });
  ui.codexCanvas.addEventListener("pointerup", (event) => {
    codexViewer.dragging = false;
    ui.codexCanvas.releasePointerCapture(event.pointerId);
  });
  ui.codexCanvas.addEventListener("pointercancel", () => {
    codexViewer.dragging = false;
  });
  resizeCodexViewer();
}

function buildCodexCards() {
  ui.codexCards.innerHTML = "";
  for (const info of CHARACTER_CODEX) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.character = info.id;
    button.textContent = CHARACTER_TYPES[info.id].label;
    button.addEventListener("click", () => selectCodexCharacter(info.id));
    ui.codexCards.appendChild(button);
  }
}

function selectCodexCharacter(character) {
  const info = CHARACTER_CODEX.find((item) => item.id === character) || CHARACTER_CODEX[0];
  if (!codexViewer) return;
  codexViewer.character = info.id;
  renderCodexModel(info);
  ui.codexName.textContent = CHARACTER_TYPES[info.id].label;
  ui.codexRole.textContent = info.role;
  ui.codexWeapon.textContent = info.weapon;
  ui.codexPassive.textContent = info.passive;
  ui.codexSkill.textContent = info.skill || "";
  ui.codexUpgrades.innerHTML = info.upgrades.map((upgrade) => `<li>${upgrade}</li>`).join("");
  for (const button of ui.codexCards.querySelectorAll("[data-character]")) {
    button.classList.toggle("selected", button.dataset.character === info.id);
  }
  updateCodexModelToggle();
}

function renderCodexModel(info) {
  if (codexViewer.model) codexViewer.scene.remove(codexViewer.model);
  codexViewer.model = makePlayerMesh(CHARACTER_TYPES[info.id].label, true, info.id, { legacy: codexViewer.modelMode === "legacy" });
  codexViewer.model.scale.setScalar(1.25);
  codexViewer.model.position.y = -0.08;
  codexViewer.rotation = 0;
  codexViewer.scene.add(codexViewer.model);
}

function setCodexModelMode(mode) {
  if (!codexViewer || !["current", "legacy"].includes(mode)) return;
  if (codexViewer.modelMode === mode) return;
  codexViewer.modelMode = mode;
  const info = CHARACTER_CODEX.find((item) => item.id === codexViewer.character) || CHARACTER_CODEX[0];
  renderCodexModel(info);
  updateCodexModelToggle();
}

function updateCodexModelToggle() {
  for (const button of ui.codexModelToggle?.querySelectorAll("[data-model-mode]") || []) {
    button.classList.toggle("selected", button.dataset.modelMode === codexViewer.modelMode);
  }
}

function resizeCodexViewer() {
  if (!codexViewer) return;
  const rect = ui.codexCanvas.parentElement.getBoundingClientRect();
  const width = Math.max(240, Math.floor(rect.width));
  const height = Math.max(220, Math.floor(rect.height));
  codexViewer.renderer.setSize(width, height, false);
  codexViewer.camera.aspect = width / height;
  codexViewer.camera.updateProjectionMatrix();
}

function animateCodex() {
  if (!codexViewer || ui.characterCodex.classList.contains("hidden")) return;
  resizeCodexViewer();
  if (codexViewer.model) {
    codexViewer.model.rotation.y = codexViewer.rotation;
    codexViewer.model.position.y = -0.08 + Math.sin(performance.now() * 0.002) * 0.025;
    if (codexViewer.model.userData.modelRoot?.userData.mixer) {
      playModelAction(codexViewer.model.userData.modelRoot, "Idle");
      codexViewer.model.userData.modelRoot.userData.mixer.update(0.016);
    }
  }
  codexViewer.renderer.render(codexViewer.scene, codexViewer.camera);
  codexViewer.raf = requestAnimationFrame(animateCodex);
}

function updateUi() {
  const player = localPlayer() || state.players[0];
  ui.level.textContent = player.level || 1;
  ui.hp.textContent = `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`;
  ui.time.textContent = formatTime(state.elapsed);
  ui.kills.textContent = state.kills;
  ui.xpFill.style.width = `${Math.min(100, (player.xp / player.xpNext) * 100)}%`;
  const skillCooldown = player.skillCooldown || 30;
  const skillPct = clamp((player.skillCharge || 0) / skillCooldown, 0, 1);
  ui.skillFill.style.width = `${Math.round(skillPct * 100)}%`;
  ui.skillText.textContent = skillPct >= 1 ? "READY" : `${Math.ceil(skillCooldown - (player.skillCharge || 0))}s`;
  ui.skillText.closest(".skill-hud")?.classList.toggle("ready", skillPct >= 1);
  ui.skillReadyHint?.classList.toggle("hidden", skillPct < 1 || net.phase !== "playing" || !state.running);
  const buildSummary = formatBuildSummary(player);
  const room = net.roomCode ? ` / 部屋 ${net.roomCode}` : "";
  const revive = player.dead ? ` / 復活まで${Math.max(0, Math.ceil(player.reviveAt - state.elapsed))}秒` : "";
  const characterName = CHARACTER_TYPES[player.character || "archer"]?.label || "アーチャー";
  const weapon = player.character === "saber"
    ? `薙ぎ払い${Math.round(THREE.MathUtils.radToDeg(player.slashArc || 0))}度`
    : player.character === "witch"
      ? `元素魔法`
      : player.character === "ninja"
        ? `刀 / 手裏剣${ninjaShurikenCount(player)}個 / 貫通${ninjaShurikenPierce(player)}`
      : `${player.arrows}本 / 後方${player.backShots || 0}本 / 貫通${player.pierce}`;
  ui.build.textContent = `${characterName} / ${weapon} / 威力${Math.round(player.damage)} / ${buildSummary}${room}${revive}`;
}

function formatBuildSummary(player) {
  if (!player.upgrades?.length) return "強化なし";
  const counts = new Map();
  for (const name of player.upgrades) counts.set(name, (counts.get(name) || 0) + 1);
  const parts = [];
  const handled = new Set();
  const addCount = (name, label = name) => {
    const count = counts.get(name) || 0;
    if (count > 0) {
      parts.push(`${label}:${count}`);
      handled.add(name);
    }
  };
  const addPercent = (name, label, percent) => {
    const count = counts.get(name) || 0;
    if (count > 0) {
      parts.push(`${label} +${count * percent}%`);
      handled.add(name);
    }
  };
  const addFlat = (name, label, amount) => {
    const count = counts.get(name) || 0;
    if (count > 0) {
      parts.push(`${label} +${count * amount}`);
      handled.add(name);
    }
  };
  addPercent("攻撃速度 +18%", "攻撃速度", 18);
  addPercent("移動速度 +15%", "移動速度", 15);
  addPercent("ダメージ +25%", "ダメージ", 25);
  addFlat("最大HP +25", "最大HP", 25);
  addCount("吸血");
  addPercent("磁力 +40%", "磁力", 40);
  addCount("矢の本数 +1", "矢の本数");
  addCount("貫通 +1", "貫通");
  addCount("バックショット");
  addCount("アイススパイク");
  addCount("サンダーストーム");
  addCount("ファイア巨大化");
  addCount("剣閃範囲 +10度", "剣閃範囲");
  addCount("飛燕斬");
  addCount("二連斬り");
  addCount("風魔手裏剣");
  addCount("影分身");
  addCount("影縫い");
  for (const [name, count] of counts) {
    if (handled.has(name)) continue;
    if (!upgrades.some((up) => up.name === name)) continue;
    parts.push(count > 1 ? `${name}:${count}` : name);
  }
  return parts.length ? parts.join(" / ") : "強化なし";
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(220, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateAim(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerOnCanvas = true;
  refreshAimFromPointer();
}

function showStatus(title, text = "") {
  ui.statusTitle.textContent = title;
  ui.statusText.textContent = text;
  ui.pauseTitleButton?.classList.add("hidden");
  ui.statusOverlay.classList.remove("hidden");
}

function hideStatus() {
  ui.statusOverlay.classList.add("hidden");
  ui.pauseTitleButton?.classList.add("hidden");
}

function isGamePaused() {
  return Boolean(state.paused || net.pausedBy || net.waitingFor);
}

function applyPause(playerId) {
  net.pausedBy = playerId;
  if (playerId === localPlayerId) showStatus("ポーズ中", "Escで再開します。");
  else showStatus("他のプレイヤーがポーズ中です", `${playerNameById(playerId)} がポーズしています。`);
  ui.pauseTitleButton?.classList.remove("hidden");
}

function clearPause() {
  net.pausedBy = null;
  if (!net.waitingFor) hideStatus();
}

function togglePause() {
  if (!state.running || state.pendingLevel) return;
  const paused = net.pausedBy !== localPlayerId;
  if (net.mode === "client") {
    sendToHost({ type: "pause", id: localPlayerId, paused });
  } else {
    if (paused) applyPause(localPlayerId);
    else clearPause();
    broadcast({ type: "pause", id: localPlayerId, paused });
  }
}

async function createRoom() {
  if (!window.Peer) {
    ui.roomStatus.textContent = "PeerJSを読み込めませんでした。";
    return;
  }
  closeConnections();
  const roomName = ui.roomNameInput.value.trim() || `${playerName()}の部屋`;
  normalizePasswordInput(ui.roomPasswordInput);
  const password = ui.roomPasswordInput.value.trim();
  const code = roomKey(roomName);
  localPlayerId = "host";
  net.mode = "host";
  net.phase = "lobby";
  net.roomCode = code;
  net.roomName = roomName;
  net.roomPassword = password;
  net.roomOwnerToken = crypto.randomUUID();
  net.stageId = selectedStage();
  net.difficultyId = selectedDifficulty();
  net.lobbyPlayers = [{ id: localPlayerId, name: playerName(), character: selectedCharacter(), host: true }];
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  selectedRoomKey = code;
  rememberRoom({ code, name: roomName, host: playerName(), hasPassword: Boolean(password), password });
  renderRoomList();
  ui.roomStatus.textContent = `準備中: ${code}`;
  net.peer = new Peer(`vansaba-${code}`);
  net.peer.on("open", () => {
    showLobby("ホストです。参加者が揃ったら開始してください。");
    startLobbyHeartbeat();
  });
  net.peer.on("connection", (conn) => {
    net.clients.set(conn.peer, conn);
    conn.on("data", (data) => handleClientData(conn, data));
    conn.on("close", () => {
      net.clients.delete(conn.peer);
      if (conn.playerId) {
        net.clients.delete(conn.playerId);
        removePlayerEverywhere(conn.playerId);
      }
    });
  });
  net.peer.on("error", (error) => {
    ui.roomStatus.textContent = `部屋作成エラー: ${error.type || error.message}`;
  });
}

function oldJoinRoom() {
  if (!window.Peer) {
    ui.roomStatus.textContent = "PeerJSを読み込めませんでした。";
    return;
  }
  const code = ui.roomInput.value.trim().toUpperCase();
  if (!code) {
    ui.roomStatus.textContent = "パスワードを入力してください。";
    return;
  }
  closeConnections();
  net.mode = "client";
  net.phase = "lobby";
  net.roomCode = code;
  localPlayerId = `guest-${Math.random().toString(36).slice(2, 7)}`;
  net.peer = new Peer();
  net.peer.on("open", () => {
    net.conn = net.peer.connect(`vansaba-${code}`, { reliable: false });
    net.conn.on("open", () => {
      sendToHost({ type: "hello", id: localPlayerId, name: playerName(), character: selectedCharacter() });
      showLobby("ホストの開始を待っています。");
    });
    net.conn.on("data", handleHostData);
    net.conn.on("close", () => showLobby("ホストとの接続が切れました。"));
    net.conn.on("error", () => {
      if (room?.code) removeRememberedRoom(room.code);
      ui.roomStatus.textContent = "部屋に接続できませんでした。部屋一覧から削除しました。";
      showTitle();
    });
  });
  net.peer.on("error", (error) => {
    ui.roomStatus.textContent = `参加エラー: ${error.type || error.message}`;
  });
}

function showLobby(message) {
  cancelAnimationFrame(animationId);
  setMenuBackdrop(true);
  if (state) state.running = false;
  stopBgm();
  ui.skillText.closest(".skill-hud")?.classList.add("hidden");
  ui.start.classList.add("hidden");
  ui.createRoomPanel.classList.add("hidden");
  ui.joinRoomPanel.classList.add("hidden");
  ui.gameOver.classList.add("hidden");
  ui.levelUp.classList.add("hidden");
  hideStatus();
  ui.lobby.classList.remove("hidden");
  ui.lobbyCode.textContent = lobbyRoomText();
  ui.lobbyStatus.textContent = message;
  ui.lobbyStartButton.classList.toggle("hidden", net.mode !== "host");
  renderLobbyPlayers();
  updateOnlineBadge();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  refreshOnlinePresenceCount();
}

function lobbyRoomText() {
  const stage = STAGES[net.stageId]?.label || "ステージ1";
  const difficulty = DIFFICULTIES[net.difficultyId]?.label || "ノーマル";
  const password = net.roomPassword ? ` / パスワード: ${net.roomPassword}` : "";
  return `部屋ID: ${net.roomCode}${password} / ${stage} / ${difficulty}`;
}

function renderLobbyPlayers() {
  ui.lobbyPlayers.innerHTML = "";
  for (const player of net.lobbyPlayers) {
    const row = document.createElement("div");
    row.className = "lobby-player";
    const className = CHARACTER_TYPES[player.character || "archer"]?.label || "アーチャー";
    row.innerHTML = `<span>${player.name} / ${className}</span><span>${player.host ? "ホスト" : "参加"}</span>`;
    ui.lobbyPlayers.appendChild(row);
  }
  updateOnlineBadge();
}

function handleClientData(conn, data) {
  if (!data || net.mode !== "host") return;
  if (data.type === "hello") {
    if ((net.roomPassword || "") !== (data.password || "")) {
      conn.send({ type: "toast", text: "パスワードが違います。" });
      conn.close();
      return;
    }
    conn.playerId = data.id;
    net.clients.set(data.id, conn);
    upsertLobbyPlayer({ id: data.id, name: data.name || "Guest", character: data.character || "archer", host: false });
    showToast(`${data.name || "Guest"}が入室しました`);
    broadcast({ type: "toast", text: `${data.name || "Guest"}が入室しました` });
    if (net.phase === "playing" && state?.running) {
      addPlayerToMatch(data.id, data.name || "Guest", data.character || "archer");
      conn.send({ type: "start", players: state.players.map((p) => ({ id: p.id, name: p.name, character: p.character })), stageId: state.stageId, difficultyId: state.difficultyId });
      sendHostSnapshot(true);
    }
    broadcastLobby();
  }
  if (data.type === "input" && state?.running) {
    const player = state.players.find((p) => p.id === data.id);
    if (player) player.input = data.input;
  }
  if (data.type === "pause") {
    if (data.paused) applyPause(data.id);
    else if (net.pausedBy === data.id) clearPause();
    broadcast({ type: "pause", id: data.id, paused: data.paused });
  }
  if (data.type === "levelChoice") chooseUpgrade(data.id, data.upgrade);
  if (data.type === "rerollRequest") rerollChoices(data.id);
  if (data.type === "restartRequest" && net.phase === "gameover") voteRestart(data.id);
  if (data.type === "leave") removePlayerEverywhere(data.id);
  if (data.type === "comm") broadcastComm(data.id, data.text);
  if (data.type === "debugSkillFill") {
    if (fillSkillForDebug(data.id)) sendHostSnapshot(true);
  }
  if (data.type === "debugBossSpawn") {
    spawnDebugBoss(data.kind === "boss" ? "boss" : "mid");
  }
  if (data.type === "skill") {
    const player = state.players.find((p) => p.id === data.id);
    if (player && activateSkill(player)) sendHostSnapshot(true);
  }
}

function handleHostData(data) {
  if (!data) return;
  if (data.type === "lobby") {
    net.lobbyPlayers = data.players || [];
    net.stageId = data.stageId || net.stageId || "stage1";
    net.difficultyId = data.difficultyId || net.difficultyId || "normal";
    if (net.phase === "playing") {
      updateOnlineBadge();
      return;
    }
    showLobby("ホストの開始を待っています。");
  }
  if (data.type === "start") {
    net.phase = "playing";
    setMenuBackdrop(false);
    net.stageId = data.stageId || net.stageId || "stage1";
    net.difficultyId = data.difficultyId || net.difficultyId || "normal";
    net.restartVotes = new Set();
    initAudio();
    sfx("start");
    startBgm();
    ui.start.classList.add("hidden");
    ui.createRoomPanel.classList.add("hidden");
    ui.joinRoomPanel.classList.add("hidden");
    ui.lobby.classList.add("hidden");
    ui.gameOver.classList.add("hidden");
    ui.levelUp.classList.add("hidden");
    ui.skillText.closest(".skill-hud")?.classList.remove("hidden");
    hideStatus();
    cancelAnimationFrame(animationId);
    if (state) resetSceneEntities();
    state = newState(data.players || [{ id: localPlayerId, name: playerName() }], { stageId: net.stageId, difficultyId: net.difficultyId });
    applyStageTheme(state.stageId);
    state.running = true;
    ui.restartButton.disabled = false;
    updateOnlineBadge();
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }
  if (data.type === "snapshot") applySnapshot(data);
  if (data.type === "sound") playSound(data.kind, { remote: true });
  if (data.type === "pause") {
    if (data.paused) applyPause(data.id);
    else clearPause();
  }
  if (data.type === "toast") showToast(data.text);
  if (data.type === "skillBanner") showSkillBanner(data.playerName, data.skill);
  if (data.type === "comm") showToast(`${data.name}: ${data.text}`);
  if (data.type === "levelOffer" && data.playerId === localPlayerId) {
    net.waitingFor = localPlayerId;
    state.paused = true;
    const player = localPlayer();
    if (player) player.rerolls = data.rerolls ?? player.rerolls;
    showLevelChoices(localPlayer(), data.choices);
  }
  if (data.type === "levelWaiting") {
    net.waitingFor = data.playerId;
    if (data.playerId !== localPlayerId) showStatus("他のプレイヤーの選択を待っています", `${playerNameById(data.playerId)} が強化を選んでいます。`);
  }
  if (data.type === "levelDone") {
    net.waitingFor = null;
    state.paused = false;
    ui.levelUp.classList.add("hidden");
    hideStatus();
  }
  if (data.type === "gameOver") {
    net.phase = "gameover";
    state.running = false;
    stopBgm();
    sfx(data.won ? "victory" : "gameover");
    ui.skillText.closest(".skill-hud")?.classList.add("hidden");
    const earnedMoney = awardMoney(data.won, { elapsed: data.elapsed, kills: data.kills, stageId: data.stageId });
    ui.endTitle.textContent = data.won ? "Clear!" : "Game Over";
    ui.endText.textContent = `${endSummaryText(data.elapsed, data.kills, false)} / ${earnedMoney}G獲得`;
    ui.restartButton.textContent = "コンティニューに投票";
    ui.disbandButton.classList.remove("hidden");
    ui.gameOver.classList.remove("hidden");
  }
  if (data.type === "gameOver") {
    ui.restartButton.textContent = "コンティニューに投票";
    ui.voteText.textContent = `再戦投票: 0/${data.total || "?"}`;
  }
  if (data.type === "voteStatus") ui.voteText.textContent = `再戦投票: ${data.count}/${data.total}`;
  if (data.type === "disband") leaveRoom();
}

function applySnapshot(data) {
  state.elapsed = data.elapsed;
  state.kills = data.kills;
  net.pausedBy = data.pausedBy || null;
  net.waitingFor = data.waitingFor || null;
  syncPlayers(data.players || []);
  syncSimpleMeshes(state.renderCache.enemies, data.enemies || [], (item) => makeEnemyMesh(item), 0);
  syncSimpleMeshes(state.renderCache.arrows, data.arrows || [], makeProjectileMesh, 1.1);
  syncSimpleMeshes(state.renderCache.bullets, data.bullets || [], makeBulletMesh, 1.05);
  syncSimpleMeshes(state.renderCache.gems, data.gems || [], makeGemMesh, 0.55);
  syncSimpleMeshes(state.renderCache.hearts, data.hearts || [], makeHeartMesh, 0.7);
  syncSimpleMeshes(state.renderCache.magnets, data.magnets || [], makeMagnetMesh, 0.76);
  syncSimpleMeshes(state.renderCache.circles, data.circles || [], makeMagicCircleMesh, 0.1);
  syncRockfalls(data.rockfalls || []);
  syncBossZones(data.bossZones || []);
  syncEffects(data.effects || []);
  if (net.pausedBy) applyPause(net.pausedBy);
  else if (net.waitingFor && net.waitingFor !== localPlayerId) showStatus("他のプレイヤーの選択を待っています", `${playerNameById(net.waitingFor)} が強化を選んでいます。`);
  else if (!net.waitingFor) hideStatus();
  updateCamera();
  updateUi();
}

function sendClientInput() {
  if (!net.conn || !net.conn.open || net.phase !== "playing") return;
  net.lastSend += 1;
  if (net.lastSend % 3 !== 0) return;
  sendToHost({ type: "input", id: localPlayerId, input: getLocalInput(), name: playerName() });
}

function sendHostSnapshot(force = false) {
  if (net.mode !== "host" || net.clients.size === 0 || net.phase !== "playing") return;
  net.lastSend += 1;
  if (!force && net.lastSend % 4 !== 0) return;
  broadcast({
    type: "snapshot",
    elapsed: state.elapsed,
    kills: state.kills,
    pausedBy: net.pausedBy,
    waitingFor: net.waitingFor,
    players: state.players.map((p) => ({
      id: p.id, name: p.name, x: p.x, z: p.z, hp: p.hp, maxHp: p.maxHp,
      character: p.character,
      level: p.level, xp: p.xp, xpNext: p.xpNext, dead: p.dead, reviveAt: p.reviveAt,
      invincibleUntil: p.invincibleUntil, hitFlash: p.hitFlash, input: p.input,
      angle: isSaberSpinning(p) ? (p.spinSlashAngle || 0) + state.elapsed * 18 : Math.atan2((p.input?.aimX ?? p.x) - p.x, (p.input?.aimZ ?? p.z - 1) - p.z),
      skillCharge: p.skillCharge, skillCooldown: p.skillCooldown,
      spinSlashUntil: p.spinSlashUntil, spinSlashAngle: p.spinSlashAngle,
      arrows: p.arrows, backShots: p.backShots, damage: p.damage, pierce: p.pierce,
      flyingSlash: p.flyingSlash, fumaShuriken: p.fumaShuriken, shadowClone: p.shadowClone, shadowBind: p.shadowBind,
      baseFireRate: p.baseFireRate, attackSpeedBonus: p.attackSpeedBonus, fireRate: p.fireRate,
      magicSplash: p.magicSplash, magicRadius: p.magicRadius, chainExplosion: p.chainExplosion, iceSpike: p.iceSpike, thunderCircle: p.thunderCircle,
      rerolls: p.rerolls, upgrades: p.upgrades,
    })),
    enemies: state.enemies.map((e) => ({ id: e.id, x: e.x, z: e.z, radius: e.radius, hp: e.hp, maxHp: e.maxHp, boss: e.boss, shooter: e.shooter, bomber: e.bomber, enemyType: e.enemyType, walkSeed: e.walkSeed, midBoss: e.midBoss, bossRole: e.bossRole })),
    arrows: state.arrows.map((a) => ({ id: a.id, x: a.x, z: a.z, angle: a.angle, kind: a.kind, radius: a.radius, owner: a.owner, skill: a.skill })),
    bullets: state.enemyBullets.map((b) => ({ id: b.id, x: b.x, z: b.z, kind: b.kind, colorIndex: b.colorIndex, angle: b.angle })),
    gems: state.gems.map((g) => ({ id: g.id, x: g.x, z: g.z, kind: g.kind, forceTarget: g.forceTarget })),
    hearts: state.hearts.map((h) => ({ id: h.id, x: h.x, z: h.z })),
    magnets: state.magnets.map((m) => ({ id: m.id, x: m.x, z: m.z })),
    circles: state.magicCircles.map((c) => ({ id: c.id, x: c.x, z: c.z, radius: c.radius, life: c.life, duration: c.duration })),
    rockfalls: state.rockfalls.map((r) => ({ id: r.id, x: r.x, z: r.z, radius: r.radius, life: r.life, start: r.start, impactAt: r.impactAt, impacted: r.impacted, crystal: r.crystal, fire: r.fire, hurtsEnemies: r.hurtsEnemies })),
    bossZones: state.bossZones.map((z) => ({
      id: z.id, kind: z.kind, x: z.x, z: z.z, endX: z.endX, endZ: z.endZ, angle: z.angle,
      radius: z.radius, width: z.width, length: z.length, life: z.life, start: z.start,
      impactAt: z.impactAt, impacted: z.impacted, role: z.role, delay: z.delay, startX: z.startX, startZ: z.startZ, chargeDuration: z.chargeDuration, retargetOnStart: z.retargetOnStart, retargeted: z.retargeted,
    })),
    effects: state.effects.map((fx) => ({ id: fx.id, kind: fx.kind, owner: fx.owner, skill: fx.skill, x: fx.x, z: fx.z, radius: fx.radius, arc: fx.arc, angle: fx.angle, color: fx.color, life: fx.life, start: fx.start })),
  });
}

function syncPlayers(players) {
  const ids = new Set(players.map((p) => p.id));
  for (const [id, mesh] of state.renderCache.players) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      state.renderCache.players.delete(id);
    }
  }
  for (const p of players) {
    const existingPlayer = state.players.find((player) => player.id === p.id);
    if (existingPlayer) {
      Object.assign(existingPlayer, p);
      existingPlayer.local = p.id === localPlayerId;
      setPlayerDeadVisual(existingPlayer, Boolean(p.dead));
      existingPlayer.mesh.position.set(p.x, 0, p.z);
      if (typeof p.angle === "number") existingPlayer.mesh.rotation.y = p.angle;
      animateHuman(existingPlayer, isSaberSpinning(existingPlayer) || Math.hypot(p.input?.dx || 0, p.input?.dz || 0) > 0.01, 0.033);
      setPlayerFlash(existingPlayer.mesh, playerFlashMode(existingPlayer));
      continue;
    }
    let mesh = state.renderCache.players.get(p.id);
    if (!mesh) {
      mesh = makePlayerMesh(p.name, false, p.character || "archer");
      scene.add(mesh);
      state.renderCache.players.set(p.id, mesh);
    }
    mesh.visible = true;
    const pseudo = { mesh };
    setPlayerDeadVisual(pseudo, Boolean(p.dead));
    mesh.position.set(p.x, 0, p.z);
    if (typeof p.angle === "number") mesh.rotation.y = p.angle;
    animateHumanMesh(mesh, isSaberSpinning(p) || Math.hypot(p.input?.dx || 0, p.input?.dz || 0) > 0.01, 0.033);
    setPlayerFlash(mesh, playerFlashMode(p));
  }
}

function syncSimpleMeshes(cache, items, factory, y) {
  const ids = new Set(items.map((item) => item.id));
  for (const [id, mesh] of cache) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      cache.delete(id);
    }
  }
  for (const item of items) {
    let mesh = cache.get(item.id);
    if (!mesh) {
      mesh = factory(item);
      scene.add(mesh);
      cache.set(item.id, mesh);
    }
    mesh.position.set(item.x, y || item.radius || 0.6, item.z);
    if (typeof item.angle === "number") mesh.rotation.y = item.angle;
    if (item.kind === "magic") mesh.scale.setScalar((item.radius || 0.34) / 0.34);
    if (item.boss || item.midBoss) applyHealthAura(mesh, healthPhase(item.hp, item.maxHp), item.radius || 1.5);
  }
}

function syncRockfalls(rockfalls) {
  const cache = state.renderCache.rockfalls;
  const ids = new Set(rockfalls.map((item) => item.id));
  for (const [id, mesh] of cache) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      cache.delete(id);
    }
  }
  state.rockfalls = rockfalls.map((item) => {
    let mesh = cache.get(item.id);
    if (!mesh) {
      mesh = makeRockfallMesh(item);
      scene.add(mesh);
      cache.set(item.id, mesh);
    }
    const rockfall = { ...item, mesh };
    updateRockfallMesh(rockfall, rockfall.start - rockfall.life);
    return rockfall;
  });
}

function syncBossZones(zones) {
  const cache = state.renderCache.bossZones;
  const ids = new Set(zones.map((item) => item.id));
  for (const [id, mesh] of cache) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      cache.delete(id);
    }
  }
  state.bossZones = zones.map((item) => {
    let mesh = cache.get(item.id);
    if (mesh && item.kind === "charge" && Math.abs((mesh.userData.syncLength || 0) - (item.length || 0)) > 0.05) {
      scene.remove(mesh);
      cache.delete(item.id);
      mesh = null;
    }
    if (!mesh) {
      mesh = makeBossZoneMesh(item);
      scene.add(mesh);
      cache.set(item.id, mesh);
    }
    const zone = { ...item, mesh };
    const elapsed = zone.start - zone.life;
    if (zone.delay && elapsed < zone.delay) {
      mesh.visible = false;
    } else {
      mesh.visible = true;
      updateBossZoneMesh(zone, Math.max(0, elapsed - (zone.delay || 0)));
    }
    return zone;
  });
}

function syncEffects(effects) {
  const cache = state.renderCache.effects;
  const ids = new Set(effects.map((effect) => effect.id));
  for (const [id, mesh] of cache) {
    if (!ids.has(id)) {
      scene.remove(mesh);
      cache.delete(id);
    }
  }
  for (const effect of effects) {
    let mesh = cache.get(effect.id);
    if (!mesh) {
      mesh = effect.kind === "slash" ? makeSlashMesh(effect) : effect.kind === "thunder" ? makeThunderBoltMesh(effect) : effect.kind === "ice" ? makeIceSpikeMesh(effect) : effect.kind === "ninjaClone" ? makeNinjaCloneMesh(effect) : makeRingMesh(effect);
      scene.add(mesh);
      cache.set(effect.id, mesh);
      if (effect.kind === "slash" && effect.owner && !effect.skill) sfx("saberAttack");
      if (effect.kind === "thunder") thunderSfx();
      if (effect.kind === "ice") sfx("witchIceSpike");
    }
    const t = 1 - effect.life / effect.start;
    mesh.position.set(effect.x, 0.12, effect.z);
    if (typeof effect.angle === "number") mesh.rotation.y = effect.angle;
    mesh.scale.setScalar(effect.skill ? 1 + t * 0.8 : 1);
    setEffectOpacity(mesh, Math.max(0, 0.75 * (1 - t)));
  }
}

function upsertLobbyPlayer(player) {
  const existing = net.lobbyPlayers.find((p) => p.id === player.id);
  if (existing) Object.assign(existing, player);
  else net.lobbyPlayers.push(player);
  renderLobbyPlayers();
}

function removeLobbyPlayer(id) {
  net.lobbyPlayers = net.lobbyPlayers.filter((player) => player.id !== id);
  renderLobbyPlayers();
  broadcastLobby();
}

function broadcastLobby() {
  renderLobbyPlayers();
  broadcast({ type: "lobby", players: net.lobbyPlayers, stageId: net.stageId, difficultyId: net.difficultyId });
  heartbeatRoom().catch((error) => console.warn("Failed to update room player count", error));
}

function sendToHost(message) {
  if (net.conn && net.conn.open) net.conn.send(message);
}

function sendToPlayer(playerId, message) {
  for (const conn of net.clients.values()) {
    if (conn.playerId === playerId && conn.open) conn.send(message);
  }
  broadcast({ type: "levelWaiting", playerId });
}

function broadcast(message) {
  for (const conn of net.clients.values()) {
    if (conn.open) conn.send(message);
  }
}

function supabaseReady() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && window.fetch);
}

async function supabaseRequest(path, options = {}) {
  if (!supabaseReady()) throw new Error("Supabase is not configured.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function onlineRoomFromRow(row) {
  return {
    code: row.room_id,
    name: row.room_name,
    host: row.host_name,
    hasPassword: Boolean(row.has_password),
    password: "",
    playerCount: row.player_count || 1,
    online: true,
  };
}

async function fetchOnlineRooms() {
  const rows = await supabaseRequest(`active_rooms?select=*&order=updated_at.desc&limit=24`);
  return (rows || []).map(onlineRoomFromRow);
}

async function publishRoom() {
  if (!supabaseReady() || net.mode !== "host" || !net.roomCode || !net.roomOwnerToken) return;
  await supabaseRequest("rpc/register_room", {
    method: "POST",
    body: JSON.stringify({
      p_room_id: net.roomCode,
      p_room_name: net.roomName || net.roomCode,
      p_host_name: playerName(),
      p_has_password: Boolean(net.roomPassword),
      p_owner_token: net.roomOwnerToken,
      p_player_count: Math.max(1, net.lobbyPlayers.length || state?.players?.length || 1),
    }),
  });
}

async function heartbeatRoom() {
  if (!supabaseReady() || net.mode !== "host" || !net.roomCode || !net.roomOwnerToken) return;
  await supabaseRequest("rpc/heartbeat_room", {
    method: "POST",
    body: JSON.stringify({
      p_room_id: net.roomCode,
      p_owner_token: net.roomOwnerToken,
      p_player_count: Math.max(1, net.lobbyPlayers.length || state?.players?.length || 1),
    }),
  });
}

function startLobbyHeartbeat() {
  stopLobbyHeartbeat();
  publishRoom().catch((error) => {
    console.warn("Failed to publish room", error);
    ui.roomStatus.textContent = "オンライン部屋一覧への登録に失敗しました。時間をおいてもう一度作成してください。";
  });
  lobbyHeartbeatTimer = window.setInterval(() => {
    heartbeatRoom().catch((error) => console.warn("Failed to heartbeat room", error));
  }, 10000);
}

function stopLobbyHeartbeat() {
  if (lobbyHeartbeatTimer) clearInterval(lobbyHeartbeatTimer);
  lobbyHeartbeatTimer = 0;
}

function closeOnlineRoom(roomCode = net.roomCode, ownerToken = net.roomOwnerToken) {
  if (!supabaseReady() || !roomCode || !ownerToken) return;
  supabaseRequest("rpc/close_room", {
    method: "POST",
    body: JSON.stringify({ p_room_id: roomCode, p_owner_token: ownerToken }),
  }).catch((error) => console.warn("Failed to close online room", error));
}

function getPresenceClientId() {
  const key = "vasamodo_presence_client_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function currentPresenceState() {
  if (net.phase === "playing") return "playing";
  if (net.phase === "gameover") return "gameover";
  if (net.phase === "lobby" || !ui.lobby?.classList.contains("hidden")) return "lobby";
  if (!ui.joinRoomPanel?.classList.contains("hidden")) return "join";
  if (!ui.createRoomPanel?.classList.contains("hidden")) return "create";
  if (!ui.stageSelectPanel?.classList.contains("hidden")) return "stage_select";
  return "title";
}

async function heartbeatPresence() {
  if (!supabaseReady() || !presenceClientId) return;
  await supabaseRequest("rpc/heartbeat_presence", {
    method: "POST",
    body: JSON.stringify({
      p_client_id: presenceClientId,
      p_player_name: playerName(),
      p_room_code: net.roomCode || null,
      p_page_state: currentPresenceState(),
    }),
  });
}

async function fetchOnlinePresenceCount() {
  if (!supabaseReady()) return null;
  const count = await supabaseRequest("rpc/online_presence_count", { method: "POST", body: "{}" });
  return Number.isFinite(Number(count)) ? Number(count) : null;
}

async function cleanupOldPresence() {
  if (!supabaseReady()) return;
  await supabaseRequest("rpc/cleanup_old_presence", { method: "POST", body: "{}" });
}

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  refreshOnlinePresenceCount();
  presenceHeartbeatTimer = window.setInterval(() => {
    heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  }, 5000);
  presenceCountTimer = window.setInterval(refreshOnlinePresenceCount, 5000);
  presenceCleanupTimer = window.setInterval(() => {
    cleanupOldPresence().catch((error) => console.warn("Failed to cleanup presence", error));
  }, 60000);
}

function stopPresenceHeartbeat() {
  if (presenceHeartbeatTimer) clearInterval(presenceHeartbeatTimer);
  if (presenceCountTimer) clearInterval(presenceCountTimer);
  if (presenceCleanupTimer) clearInterval(presenceCleanupTimer);
  presenceHeartbeatTimer = 0;
  presenceCountTimer = 0;
  presenceCleanupTimer = 0;
}

async function refreshOnlinePresenceCount() {
  if (onlineBadgeLoading) return;
  onlineBadgeLoading = true;
  try {
    const count = await fetchOnlinePresenceCount();
    if (count !== null) {
      onlinePresenceCount = Math.max(1, count);
      updateOnlineBadge();
    }
  } catch (error) {
    console.warn("Failed to fetch online presence count", error);
  } finally {
    onlineBadgeLoading = false;
  }
}

function closePresence() {
  if (!supabaseReady() || !presenceClientId) return;
  fetch(`${SUPABASE_URL}/rest/v1/online_presence?client_id=eq.${encodeURIComponent(presenceClientId)}`, {
    method: "DELETE",
    keepalive: true,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }).catch(() => {});
}

function closeConnections() {
  const closingRoomCode = net.roomCode;
  const closingOwnerToken = net.roomOwnerToken;
  const closingAsHost = net.mode === "host";
  stopLobbyHeartbeat();
  if (closingAsHost) closeOnlineRoom(closingRoomCode, closingOwnerToken);
  if (net.conn) net.conn.close();
  for (const conn of net.clients.values()) conn.close();
  if (net.peer) net.peer.destroy();
  net = { mode: "solo", phase: "menu", peer: null, conn: null, clients: new Map(), lobbyPlayers: [], roomCode: "", roomName: "", roomPassword: "", roomOwnerToken: "", stageId: selectedStage(), difficultyId: selectedDifficulty(), pausedBy: null, waitingFor: null, lastSend: 0, restartVotes: new Set() };
}

function leaveRoom() {
  const oldRoomCode = net.roomCode;
  const wasHost = net.mode === "host";
  if (net.mode === "client") sendToHost({ type: "leave", id: localPlayerId });
  if (net.mode === "host") broadcast({ type: "disband" });
  if (state) state.running = false;
  closeConnections();
  if (wasHost && oldRoomCode) removeRememberedRoom(oldRoomCode);
  ui.lobby.classList.add("hidden");
  ui.gameOver.classList.add("hidden");
  ui.levelUp.classList.add("hidden");
  hideStatus();
  showTitle();
  updateOnlineBadge();
}

function oldRestartMatch() {
  if (net.mode === "solo") {
    startGame("solo");
  } else if (net.mode === "host") {
    startGame("host");
  } else {
    sendToHost({ type: "restartRequest", id: localPlayerId });
    showStatus("待機中", "ホストが再開するのを待っています。");
  }
}

function localPlayer() {
  return state.players.find((p) => p.local) || state.players[0];
}

function nearestLivingPlayer(source) {
  return livingPlayers().sort((a, b) => distance(source, a) - distance(source, b))[0];
}

function nearestGemPlayer(gem) {
  return livingPlayers().sort((a, b) => distance(gem, a) - distance(gem, b))[0];
}

function livingPlayers() {
  return state.players.filter((p) => !p.dead && p.hp > 0);
}

function playerNameById(id) {
  return state.players.find((p) => p.id === id)?.name || net.lobbyPlayers.find((p) => p.id === id)?.name || "他のプレイヤー";
}

function playerName() {
  return ui.playerName.value.trim().slice(0, 14) || "Player";
}

function defaultProgress() {
  return {
    money: 0,
    characters: { archer: true, witch: false, saber: false },
    stages: { stage1: true, stage2: false, stage3: false },
    permanent: { power: 0, vitality: 0, speed: 0, magnet: 0 },
  };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    const base = defaultProgress();
    return {
      money: Math.max(0, Number(saved.money) || 0),
      characters: { ...base.characters, ...(saved.characters || {}) },
      stages: { ...base.stages, ...(saved.stages || {}) },
      permanent: { ...base.permanent, ...(saved.permanent || {}) },
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function progressItemCost(item) {
  if (item.type !== "permanent") return item.cost || 0;
  const level = progress.permanent[item.id] || 0;
  return item.baseCost + item.costStep * level;
}

function ownsShopItem(item) {
  if (item.type === "character") return Boolean(progress.characters[item.id]);
  if (item.type === "stage") return Boolean(progress.stages[item.id]);
  if (item.type === "permanent") return (progress.permanent[item.id] || 0) >= item.max;
  return false;
}

function buyShopItem(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item || ownsShopItem(item)) return;
  const cost = progressItemCost(item);
  if (progress.money < cost) {
    showToast("お金が足りません");
    return;
  }
  progress.money -= cost;
  if (item.type === "character") progress.characters[item.id] = true;
  if (item.type === "stage") progress.stages[item.id] = true;
  if (item.type === "permanent") progress.permanent[item.id] = Math.min(item.max, (progress.permanent[item.id] || 0) + 1);
  saveProgress();
  updateProgressUi();
  showToast(`${item.name}を購入しました`);
}

function updateProgressUi() {
  if (ui.moneyBadge) ui.moneyBadge.textContent = `${progress.money}G`;
  ui.moneyBadge?.parentElement?.classList.toggle("hidden", net.phase === "playing" || net.phase === "gameover");
  if (ui.shopMoney) ui.shopMoney.textContent = `所持金 ${progress.money}G`;
  renderShop();
  updateCharacterLocks();
  updateStageDifficultyButtons();
}

function renderShop() {
  if (!ui.shopItems) return;
  ui.shopItems.innerHTML = "";
  for (const item of SHOP_ITEMS) {
    const owned = ownsShopItem(item);
    const level = item.type === "permanent" ? progress.permanent[item.id] || 0 : 0;
    const cost = progressItemCost(item);
    const card = document.createElement("section");
    card.className = "shop-card";
    const status = item.type === "permanent" ? `Lv ${level}/${item.max}` : owned ? "購入済み" : "未購入";
    card.innerHTML = `<strong>${item.name}</strong><p>${item.desc}</p><small>${status}</small>`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = owned ? "購入済み" : `${cost}Gで購入`;
    button.disabled = owned || progress.money < cost;
    button.addEventListener("click", () => buyShopItem(item.id));
    card.appendChild(button);
    ui.shopItems.appendChild(card);
  }
}

function isCharacterUnlocked(character) {
  if (character === "ninja") return true;
  return Boolean(progress.characters[character]);
}

function isStageProgressUnlocked(stageId) {
  if (stageId === "stage3") return stage3DebugUnlocked;
  return Boolean(progress.stages[stageId]);
}

function updateCharacterLocks() {
  if (!ui.characterSelect) return;
  for (const button of ui.characterSelect.querySelectorAll("[data-character]")) {
    const character = button.dataset.character || "archer";
    const locked = !isCharacterUnlocked(character);
    button.classList.toggle("locked", locked);
    button.disabled = locked;
    button.title = locked ? "ショップで購入すると使用できます" : "";
  }
  if (!isCharacterUnlocked(selectedCharacterId)) {
    selectedCharacterId = "archer";
    for (const item of ui.characterSelect.querySelectorAll("[data-character]")) item.classList.toggle("selected", item.dataset.character === "archer");
  }
}

function applyPermanentBonuses(player) {
  const permanent = progress.permanent || {};
  const hpBonus = (permanent.vitality || 0) * 10;
  const damageBonus = 1 + (permanent.power || 0) * 0.05;
  const speedBonus = 1 + (permanent.speed || 0) * 0.03;
  const magnetBonus = 1 + (permanent.magnet || 0) * 0.08;
  player.maxHp += hpBonus;
  player.hp = player.maxHp;
  player.damage *= damageBonus;
  player.speed *= speedBonus;
  player.magnet *= magnetBonus;
}

function awardMoney(won, stats = {}) {
  const player = localPlayer() || state.players[0];
  if (!player || net.mode === "host" && !player.local) return 0;
  const stageId = stats.stageId || state.stageId;
  const kills = stats.kills ?? state.kills;
  const elapsed = stats.elapsed ?? state.elapsed;
  const stageBonus = stageId === "stage3" ? 80 : stageId === "stage2" ? 45 : 25;
  const earned = Math.max(1, Math.floor(kills * 1.2 + (player.level || 1) * 8 + elapsed / 12 + (won ? stageBonus : 0)));
  progress.money += earned;
  saveProgress();
  updateProgressUi();
  return earned;
}

function toHalfWidth(text) {
  return text
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

function normalizePasswordInput(input) {
  const normalized = toHalfWidth(input.value);
  if (input.value !== normalized) input.value = normalized;
}

function trackDebugStage3Key() {
  const now = performance.now();
  debugStage3Presses = debugStage3Presses.filter((time) => now - time <= 2000);
  debugStage3Presses.push(now);
  if (debugStage3Presses.length < 3) return;
  debugStage3Presses = [];
  stage3DebugUnlocked = true;
  updateStageDifficultyButtons();
  showToast("デバッグ解放: ステージ3を選択できます");
}

function canUseTitleDebugInput() {
  return Boolean(
    net.phase !== "playing" &&
    !ui.start.classList.contains("hidden") &&
    ui.updateInfo.classList.contains("hidden") &&
    ui.characterCodex.classList.contains("hidden") &&
    ui.shopPanel.classList.contains("hidden")
  );
}

function trackDebugMoneyKey(key) {
  if (!canUseTitleDebugInput()) return;
  const letter = String(key || "").toLowerCase();
  if (!/^[a-z]$/.test(letter)) return;
  const now = performance.now();
  debugMoneySequence = debugMoneySequence.filter((entry) => now - entry.time <= 3000);
  debugMoneySequence.push({ key: letter, time: now });
  const typed = debugMoneySequence.map((entry) => entry.key).join("");
  if ("money".startsWith(typed)) {
    if (typed === "money") {
      debugMoneySequence = [];
      progress.money += 99999;
      saveProgress();
      updateProgressUi();
      showToast("デバッグ: 99999Gを入手しました");
    }
    return;
  }
  debugMoneySequence = letter === "m" ? [{ key: "m", time: now }] : [];
}

function selectedCharacter() {
  if (playerName().toUpperCase() === "NINJA") return "ninja";
  return CHARACTER_TYPES[selectedCharacterId] ? selectedCharacterId : "archer";
}

function selectedStage() {
  return STAGES[selectedStageId] ? selectedStageId : "stage1";
}

function selectedDifficulty() {
  return DIFFICULTIES[selectedDifficultyId] ? selectedDifficultyId : "normal";
}

function selectStage(stageId) {
  if (stageId === "stage3" && !stage3DebugUnlocked) {
    selectedStageId = "stage1";
    showToast("ステージ3はデバッグ中です");
    updateStageDifficultyButtons();
    return;
  }
  if (!isStageProgressUnlocked(stageId)) {
    showToast("ショップでステージを解放してください");
    updateStageDifficultyButtons();
    return;
  }
  selectedStageId = STAGES[stageId] ? stageId : "stage1";
  updateStageDifficultyButtons();
}

function selectDifficulty(difficultyId) {
  selectedDifficultyId = DIFFICULTIES[difficultyId] ? difficultyId : "normal";
  updateStageDifficultyButtons();
}

function updateStageDifficultyButtons() {
  for (const root of [ui.stageSelect, ui.roomStageSelect]) {
    for (const button of root?.querySelectorAll("[data-stage]") || []) {
      const debugLocked = button.dataset.stage === "stage3" && !stage3DebugUnlocked;
      const progressLocked = !debugLocked && !isStageProgressUnlocked(button.dataset.stage);
      const locked = debugLocked || progressLocked;
      button.classList.toggle("selected", button.dataset.stage === selectedStageId);
      button.classList.toggle("locked", debugLocked);
      button.classList.toggle("progress-locked", progressLocked);
      button.disabled = locked;
      button.title = debugLocked ? "デバッグ中: 2秒以内に3キーを3回押すと解放" : progressLocked ? "ショップで解放すると選択できます" : "";
    }
  }
  for (const root of [ui.difficultySelect, ui.roomDifficultySelect]) {
    for (const button of root?.querySelectorAll("[data-difficulty]") || []) {
      button.classList.toggle("selected", button.dataset.difficulty === selectedDifficultyId);
    }
  }
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function endSummaryText(elapsed, kills, includeLevel = true) {
  const level = localPlayer()?.level || 1;
  const parts = [`${formatTime(elapsed)}`, `${kills}体撃破`];
  if (includeLevel) parts.push(`レベル${level}`);
  return parts.join(" / ");
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomEdge() {
  return -WORLD.half + Math.random() * WORLD.half * 2;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeUpgradeChoices(player = localPlayer()) {
  const character = player?.character || "archer";
  return shuffle(upgrades.filter((up) => canOfferUpgrade(up, player, character))).slice(0, 3).map((up) => up.name);
}

function upgradeLevel(player, name) {
  return (player?.upgrades || []).filter((upgradeName) => upgradeName === name).length;
}

function upgradeMaxLevel(up) {
  return up.maxLevel || UPGRADE_MAX_LEVEL;
}

function canOfferUpgrade(up, player, character = player?.character || "archer") {
  if (!up) return false;
  if (up.classes && !up.classes.includes(character)) return false;
  return upgradeLevel(player, up.name) < upgradeMaxLevel(up);
}

function endGame(won) {
  state.running = false;
  state.won = won;
  net.phase = "gameover";
  stopBgm();
  sfx(won ? "victory" : "gameover");
  ui.skillText.closest(".skill-hud")?.classList.add("hidden");
  net.restartVotes = new Set();
  const earnedMoney = awardMoney(won);
  ui.endTitle.textContent = won ? "Clear!" : "Game Over";
  ui.endText.textContent = `${endSummaryText(state.elapsed, state.kills, true)} / ${earnedMoney}G獲得`;
  ui.restartButton.textContent = net.mode === "solo" ? "コンティニュー" : "コンティニューに投票";
  ui.disbandButton.textContent = net.mode === "solo" ? "タイトルに戻る" : "解散する";
  ui.voteText.textContent = net.mode === "solo" ? "" : `再戦投票: 0/${state.players.length}`;
  ui.disbandButton.classList.remove("hidden");
  ui.gameOver.classList.remove("hidden");
  if (net.mode === "host") broadcast({ type: "gameOver", won, elapsed: state.elapsed, kills: state.kills, total: state.players.length, stageId: state.stageId });
}

function voteRestart(playerId = localPlayerId) {
  if (net.mode === "solo") {
    startGame("solo");
    return;
  }
  if (net.mode === "client") {
    sendToHost({ type: "restartRequest", id: localPlayerId });
    ui.restartButton.disabled = true;
    return;
  }
  net.restartVotes.add(playerId);
  const count = net.restartVotes.size;
  const total = state.players.length;
  ui.voteText.textContent = `再戦投票: ${count}/${total}`;
  broadcast({ type: "voteStatus", count, total });
  if (count >= total) {
    ui.restartButton.disabled = false;
    startGame("host");
  }
}

function showToast(text) {
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  clearTimeout(ui.toast._timer);
  ui.toast._timer = setTimeout(() => ui.toast.classList.add("hidden"), 2600);
}

function showSkillBanner(playerName, skill) {
  if (!ui.skillBanner) {
    showToast(`${playerName}: ${skill}`);
    return;
  }
  ui.skillBannerName.textContent = skill || "";
  ui.skillBannerPlayer.textContent = playerName ? `${playerName} 発動` : "固有スキル発動";
  ui.skillBanner.classList.remove("hidden", "flash");
  void ui.skillBanner.offsetWidth;
  ui.skillBanner.classList.add("flash");
  clearTimeout(ui.skillBanner._timer);
  ui.skillBanner._timer = setTimeout(() => ui.skillBanner.classList.add("hidden"), 1500);
}

function updateOnlineBadge() {
  if (!ui.onlineBadge) return;
  const hideInGame = net.phase === "playing" || net.phase === "gameover" || !ui.gameOver.classList.contains("hidden");
  ui.onlineBadge.classList.toggle("hidden", hideInGame);
  const fallback = net.mode === "solo" ? 1 : Math.max(1, net.lobbyPlayers.length || state.players?.length || 1);
  const count = supabaseReady() ? onlinePresenceCount || fallback : fallback;
  ui.onlineBadge.textContent = `オンライン人数: ${count}`;
}

function addPlayerToMatch(id, name, character = "archer") {
  if (state.players.some((p) => p.id === id)) return;
  const player = makePlayer(id, name, randomEdge() * 0.1, randomEdge() * 0.1, false, character);
  scene.add(player.mesh);
  state.players.push(player);
  updateOnlineBadge();
}

function removePlayerEverywhere(id) {
  const leaving = state.players.find((p) => p.id === id)?.name
    || net.lobbyPlayers.find((p) => p.id === id)?.name
    || "他のプレイヤー";
  removeLobbyPlayer(id);
  const index = state.players.findIndex((p) => p.id === id);
  if (index >= 0) {
    scene.remove(state.players[index].mesh);
    state.players.splice(index, 1);
  }
  if (net.waitingFor === id) {
    net.waitingFor = null;
    state.paused = false;
    hideStatus();
    broadcast({ type: "levelDone", playerId: id });
  }
  showToast(`${leaving}が退室しました`);
  broadcast({ type: "toast", text: `${leaving}が退室しました` });
  updateOnlineBadge();
  sendHostSnapshot();
}

function broadcastComm(id, text) {
  const name = playerNameById(id);
  showToast(`${name}: ${text}`);
  broadcast({ type: "comm", name, text });
}

function joinRoom(options = {}) {
  if (!window.Peer) {
    ui.roomStatus.textContent = "PeerJSを読み込めませんでした。";
    return;
  }
  initAudio();
  const directCode = (options.code || "").trim().toUpperCase();
  const room = directCode ? null : selectedRoom();
  const roomName = directCode ? directCode : room?.name || ui.roomNameInput.value.trim();
  normalizePasswordInput(ui.joinPasswordInput);
  normalizePasswordInput(ui.roomPasswordInput);
  if (room?.hasPassword && ui.joinPasswordInput.value.trim() === "") {
    ui.joinPasswordPanel.classList.remove("hidden");
    ui.joinPasswordLabel.textContent = `${room.name} はパスワードが必要です。`;
    ui.roomStatus.textContent = "パスワードを入力してください。";
    return;
  }
  const password = directCode
    ? (options.password || "").trim()
    : ui.joinPasswordPanel.classList.contains("hidden")
      ? (room?.online ? "" : ui.roomPasswordInput.value.trim() || room?.password || "")
      : ui.joinPasswordInput.value.trim();
  const code = directCode || room?.code || roomKey(roomName);
  if (!roomName) {
    ui.roomStatus.textContent = "参加する部屋を選択してください。";
    return;
  }
  closeConnections();
  net.mode = "client";
  net.phase = "lobby";
  net.roomCode = code;
  net.roomName = roomName;
  net.roomPassword = password;
  localPlayerId = `guest-${Math.random().toString(36).slice(2, 7)}`;
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  net.peer = new Peer();
  net.peer.on("open", () => {
    net.conn = net.peer.connect(`vansaba-${code}`, { reliable: false });
    net.conn.on("open", () => {
      sendToHost({ type: "hello", id: localPlayerId, name: playerName(), character: selectedCharacter(), password });
      rememberRoom({ code, name: room?.name || roomName, host: room?.host || "Unknown", hasPassword: Boolean(password), password });
      renderRoomList();
      showLobby("ホストの開始を待っています。");
    });
    net.conn.on("data", handleHostData);
    net.conn.on("close", () => showLobby("ホストとの接続が切れました。"));
  });
  net.peer.on("error", (error) => {
    ui.roomStatus.textContent = `参加エラー: ${error.type || error.message}`;
    if (room?.code) removeRememberedRoom(room.code);
  });
}

function roomKey(name) {
  const text = (name || "").trim();
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(36).toUpperCase();
  const ascii = text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").slice(0, 10).toUpperCase();
  return `${ascii || "ROOM"}-${suffix}`;
}

function loadRooms() {
  try {
    return JSON.parse(localStorage.getItem("vansabaRooms") || "[]");
  } catch {
    return [];
  }
}

function saveRooms(rooms) {
  localStorage.setItem("vansabaRooms", JSON.stringify(rooms.slice(0, 12)));
}

function rememberRoom(room) {
  const rooms = loadRooms().filter((item) => item.code !== room.code);
  rooms.unshift(room);
  saveRooms(rooms);
}

function selectedRoom() {
  if (selectedOnlineRoom?.code === selectedRoomKey) return selectedOnlineRoom;
  return loadRooms().find((room) => room.code === selectedRoomKey);
}

async function renderRoomList() {
  if (!ui.roomList) return;
  const localRooms = loadRooms();
  let onlineRooms = [];
  try {
    onlineRooms = await fetchOnlineRooms();
  } catch (error) {
    console.warn("Failed to fetch online rooms", error);
  }
  const onlineCodes = new Set(onlineRooms.map((room) => room.code));
  const rooms = [...onlineRooms, ...localRooms.filter((room) => !onlineCodes.has(room.code))];
  ui.roomList.innerHTML = "";
  if (!rooms.length) {
    ui.roomList.innerHTML = `<p class="small">表示できる部屋がありません。</p>`;
    return;
  }
  for (const room of rooms) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `room-card ${room.code === selectedRoomKey ? "selected" : ""}`;
    button.innerHTML = `<strong>${room.name}</strong><span>${room.hasPassword ? "鍵あり" : "鍵なし"}${room.online ? ` / ${room.playerCount || 1}人` : ""}</span><small>ホスト: ${room.host}</small><small>ID: ${room.code}</small>`;
    button.addEventListener("click", () => {
      selectedRoomKey = room.code;
      selectedOnlineRoom = room.online ? room : null;
      ui.roomNameInput.value = room.name;
      ui.roomPasswordInput.value = room.password || "";
      if (room.hasPassword) {
        ui.joinPasswordPanel.classList.remove("hidden");
        ui.joinPasswordLabel.textContent = `${room.name} はパスワードが必要です。`;
        ui.joinPasswordInput.value = "";
      } else {
        ui.joinPasswordPanel.classList.add("hidden");
        joinRoom();
      }
      renderRoomList();
    });
    ui.roomList.appendChild(button);
  }
}

function removeRememberedRoom(code) {
  saveRooms(loadRooms().filter((room) => room.code !== code));
  if (selectedRoomKey === code) selectedRoomKey = "";
  renderRoomList();
}

function showTitle() {
  stopEndSounds();
  stopBgm();
  setMenuBackdrop(true);
  ui.skillText.closest(".skill-hud")?.classList.add("hidden");
  ui.start.classList.remove("hidden");
  ui.stageSelectPanel.classList.add("hidden");
  ui.createRoomPanel.classList.add("hidden");
  ui.joinRoomPanel.classList.add("hidden");
  ui.shopPanel?.classList.add("hidden");
  ui.joinPasswordPanel.classList.add("hidden");
  ui.roomStatus.textContent = "部屋作成または参加を選んでください。";
  updateOnlineBadge();
  updateProgressUi();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  refreshOnlinePresenceCount();
}

function setMenuBackdrop(enabled) {
  document.body.classList.toggle("menu-mode", enabled);
}

function restartMatch() {
  voteRestart(localPlayerId);
}

function openLevelUp(player = localPlayer()) {
  if (!player || net.mode === "client") return;
  state.paused = true;
  state.pendingLevel = player.id;
  net.waitingFor = player.id;
  player.pendingChoices = makeUpgradeChoices(player);
  if (!player.pendingChoices.length) {
    state.pendingLevel = null;
    state.paused = false;
    net.waitingFor = null;
    if (player.local) showToast("選べる強化がすべて最大レベルです");
    if (net.mode === "host") broadcast({ type: "levelDone", playerId: player.id });
    return;
  }
  if (net.mode === "host") broadcast({ type: "levelWaiting", playerId: player.id });
  if (!player.local) {
    showStatus("他のプレイヤーの選択を待っています", `${player.name} が強化を選んでいます。`);
    sendToPlayer(player.id, { type: "levelOffer", playerId: player.id, choices: player.pendingChoices, rerolls: player.rerolls });
    return;
  }
  showLevelChoices(player, player.pendingChoices);
}

function showLevelChoices(player, choiceNames) {
  ui.choices.innerHTML = "";
  for (const name of choiceNames) {
    const up = upgrades.find((item) => item.name === name);
    if (!up) continue;
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    const nextLevel = upgradeLevel(player, up.name) + 1;
    button.innerHTML = `<strong>${up.name} Lv ${nextLevel}/${upgradeMaxLevel(up)}</strong><span>${upgradeDescForPlayer(up, player)}</span>`;
    button.addEventListener("click", () => chooseUpgrade(player.id, up.name));
    ui.choices.appendChild(button);
  }
  const reroll = document.createElement("button");
  reroll.className = "reroll-button secondary";
  reroll.type = "button";
  reroll.textContent = `リロール 残り${player.rerolls || 0}回`;
  reroll.disabled = (player.rerolls || 0) <= 0;
  reroll.addEventListener("click", () => rerollChoices(player.id));
  ui.choices.appendChild(reroll);
  ui.levelUp.classList.remove("hidden");
}

function upgradeDescForPlayer(up, player) {
  const character = player?.character || "archer";
  if (up.name === "ダメージ +25%") {
    if (character === "witch") return "ファイア、魔力爆発、サンダーストーム、アイススパイク、魔女の大爆発の威力が増える。";
    if (character === "saber") return "薙ぎ払いの威力が増える。近づいた敵をまとめて倒しやすくなる。";
    if (character === "ninja") return "刀、手裏剣、飛影八閃の威力が増える。";
    return "矢の威力が増える。硬い敵に効きやすい。";
  }
  if (up.name === "攻撃速度 +18%") {
    if (character === "witch") return "ファイアを放つ間隔が短くなる。通常攻撃の回転率が上がる。";
    if (character === "saber") return "薙ぎ払いを出せる間隔が短くなる。隙を減らしやすい。";
    if (character === "ninja") return "刀と手裏剣を出す間隔が短くなる。";
    return "矢を撃つ間隔が短くなる。";
  }
  return up.desc;
}

function rerollChoices(playerId) {
  if (net.mode === "client") {
    sendToHost({ type: "rerollRequest", id: localPlayerId });
    return;
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.rerolls <= 0) return;
  player.rerolls -= 1;
  player.pendingChoices = makeUpgradeChoices(player);
  if (!player.pendingChoices.length) {
    state.pendingLevel = null;
    state.paused = false;
    net.waitingFor = null;
    ui.levelUp.classList.add("hidden");
    hideStatus();
    if (net.mode === "host") broadcast({ type: "levelDone", playerId });
    return;
  }
  if (player.local) showLevelChoices(player, player.pendingChoices);
  else sendToPlayer(player.id, { type: "levelOffer", playerId: player.id, choices: player.pendingChoices, rerolls: player.rerolls });
}

function chooseUpgrade(playerId, upgradeName) {
  if (net.mode === "client") {
    sendToHost({ type: "levelChoice", id: localPlayerId, upgrade: upgradeName });
    ui.levelUp.classList.add("hidden");
    showStatus("他のプレイヤーの選択を待っています", "ホストの反映を待っています。");
    return;
  }
  const player = state.players.find((p) => p.id === playerId);
  const up = upgrades.find((item) => item.name === upgradeName);
  if (player && up && canOfferUpgrade(up, player)) {
    up.apply(player);
    player.upgrades.push(up.name);
    player.pendingChoices = [];
  }
  state.pendingLevel = null;
  state.paused = false;
  net.waitingFor = null;
  ui.levelUp.classList.add("hidden");
  hideStatus();
  if (net.mode === "host") broadcast({ type: "levelDone", playerId });
  updateUi();
  lastTime = performance.now();
}

window.addEventListener("keydown", (event) => {
  if (!event.repeat) trackDebugMoneyKey(event.key);
  if (event.code === "Escape") {
    event.preventDefault();
    if (!ui.updateInfo.classList.contains("hidden")) {
      ui.updateInfo.classList.add("hidden");
      return;
    }
    if (!ui.characterCodex.classList.contains("hidden")) {
      closeCharacterCodex();
      return;
    }
    if (!ui.shopPanel.classList.contains("hidden")) {
      ui.shopPanel.classList.add("hidden");
      return;
    }
    togglePause();
    return;
  }
  if (event.code === "KeyP" && !event.repeat && net.phase === "playing" && state.running) {
    trackDebugSkillKey();
  }
  if (event.code === "KeyM" && !event.repeat && net.phase === "playing" && state.running) {
    trackDebugBossKey("mid");
  }
  if (event.code === "KeyB" && !event.repeat && net.phase === "playing" && state.running) {
    trackDebugBossKey("boss");
  }
  if (event.code === "Digit3" && !event.repeat && net.phase !== "playing") {
    trackDebugStage3Key();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) requestSkillUse();
    return;
  }
  if (event.code === "KeyT" && !radialActive && canUseRadial()) {
    radialActive = true;
    radialChoice = "Hello!";
    ui.radialMenu.classList.remove("hidden");
    event.preventDefault();
    return;
  }
  if (localPlayer()?.dead && (event.code === "ArrowLeft" || event.code === "ArrowRight")) {
    const alive = state.players.filter((p) => !p.dead && p.hp > 0);
    if (alive.length) {
      spectateIndex = (spectateIndex + (event.code === "ArrowRight" ? 1 : -1) + alive.length) % alive.length;
      updateCamera();
    }
    event.preventDefault();
    return;
  }
  keys.add(event.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
});
window.addEventListener("keyup", (event) => {
  if (event.code === "KeyT" && radialActive) {
    radialActive = false;
    ui.radialMenu.classList.add("hidden");
    sendCommunication(radialChoice);
    event.preventDefault();
    return;
  }
  keys.delete(event.code);
});
canvas.addEventListener("mousemove", (event) => {
  updateAim(event);
  if (radialActive) updateRadialChoice(event);
});
canvas.addEventListener("pointerdown", updateAim);
ui.startButton.addEventListener("click", () => {
  ui.start.classList.add("hidden");
  ui.stageSelectPanel.classList.remove("hidden");
  updateStageDifficultyButtons();
  updateOnlineBadge();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
});
ui.stageStartButton.addEventListener("click", () => startGame("solo"));
ui.backFromStageButton.addEventListener("click", showTitle);
ui.openCreateRoomButton.addEventListener("click", () => {
  ui.start.classList.add("hidden");
  ui.createRoomPanel.classList.remove("hidden");
  updateStageDifficultyButtons();
  updateOnlineBadge();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
});
ui.openJoinRoomButton.addEventListener("click", () => {
  ui.start.classList.add("hidden");
  ui.joinRoomPanel.classList.remove("hidden");
  ui.joinPasswordPanel.classList.add("hidden");
  updateOnlineBadge();
  heartbeatPresence().catch((error) => console.warn("Failed to heartbeat presence", error));
  renderRoomList();
});
ui.backFromCreateButton.addEventListener("click", showTitle);
ui.backFromJoinButton.addEventListener("click", showTitle);
ui.hostButton.addEventListener("click", createRoom);
ui.confirmJoinButton.addEventListener("click", joinRoom);
ui.lobbyStartButton.addEventListener("click", () => startGame("host"));
ui.leaveRoomButton.addEventListener("click", leaveRoom);
ui.restartButton.addEventListener("click", restartMatch);
ui.disbandButton.addEventListener("click", leaveRoom);
ui.pauseTitleButton.addEventListener("click", leaveRoom);
window.addEventListener("pagehide", closePresence);
window.addEventListener("beforeunload", closePresence);
ui.updateButton.addEventListener("click", () => ui.updateInfo.classList.remove("hidden"));
ui.closeUpdateButton.addEventListener("click", () => ui.updateInfo.classList.add("hidden"));
ui.settingsButton.addEventListener("click", () => ui.settingsPanel.classList.toggle("hidden"));
ui.masterVolume.addEventListener("input", (event) => setVolume("master", event.target.value));
ui.bgmVolume.addEventListener("input", (event) => setVolume("bgm", event.target.value));
ui.seVolume.addEventListener("input", (event) => setVolume("se", event.target.value));
ui.roomPasswordInput.addEventListener("input", () => normalizePasswordInput(ui.roomPasswordInput));
ui.joinPasswordInput.addEventListener("input", () => normalizePasswordInput(ui.joinPasswordInput));
for (const root of [ui.stageSelect, ui.roomStageSelect]) {
  root?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-stage]");
    if (button) selectStage(button.dataset.stage);
  });
}
for (const root of [ui.difficultySelect, ui.roomDifficultySelect]) {
  root?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-difficulty]");
    if (button) selectDifficulty(button.dataset.difficulty);
  });
}
ui.codexButton.addEventListener("click", openCharacterCodex);
ui.closeCodexButton.addEventListener("click", closeCharacterCodex);
ui.shopButton?.addEventListener("click", () => {
  renderShop();
  ui.shopPanel.classList.remove("hidden");
});
ui.closeShopButton?.addEventListener("click", () => ui.shopPanel.classList.add("hidden"));
if (ui.characterSelect) {
  for (const button of ui.characterSelect.querySelectorAll("[data-character]")) {
    button.addEventListener("click", () => {
      if (!isCharacterUnlocked(button.dataset.character || "archer")) {
        showToast("ショップでキャラを購入してください");
        return;
      }
      selectedCharacterId = button.dataset.character || "archer";
      for (const item of ui.characterSelect.querySelectorAll("[data-character]")) item.classList.toggle("selected", item === button);
      if (state) resetSceneEntities();
      state = newState([{ id: localPlayerId, name: playerName(), character: selectedCharacter() }]);
      applyStageTheme(state.stageId);
      updateUi();
    });
  }
}

function updateRadialChoice(event) {
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const angle = Math.atan2(event.clientY - cy, event.clientX - cx);
  if (angle < -Math.PI / 6 && angle > -Math.PI * 5 / 6) radialChoice = "Hello!";
  else if (angle >= -Math.PI * 5 / 6 && angle < Math.PI * 5 / 6 && event.clientX < cx) radialChoice = "Help!";
  else radialChoice = "Nice!";
  for (const button of ui.radialMenu.querySelectorAll("button")) {
    button.style.outline = button.dataset.comm === radialChoice ? "3px solid #ffd86b" : "0";
  }
}

function sendCommunication(text) {
  if (net.mode === "client") sendToHost({ type: "comm", id: localPlayerId, text });
  else broadcastComm(localPlayerId, text);
}

function canUseRadial() {
  return Boolean(state?.running && net.phase === "playing" && ui.levelUp.classList.contains("hidden") && ui.gameOver.classList.contains("hidden") && ui.lobby.classList.contains("hidden") && ui.start.classList.contains("hidden"));
}
