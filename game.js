import * as THREE from "./three.module.js";

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
  openCreateRoomButton: document.getElementById("openCreateRoomButton"),
  openJoinRoomButton: document.getElementById("openJoinRoomButton"),
  characterSelect: document.getElementById("characterSelect"),
  createRoomPanel: document.getElementById("createRoomPanel"),
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
  radialMenu: document.getElementById("radialMenu"),
  updateButton: document.getElementById("updateButton"),
  updateInfo: document.getElementById("updateInfo"),
  closeUpdateButton: document.getElementById("closeUpdateButton"),
  codexButton: document.getElementById("codexButton"),
  characterCodex: document.getElementById("characterCodex"),
  closeCodexButton: document.getElementById("closeCodexButton"),
  codexCanvas: document.getElementById("codexCanvas"),
  codexCards: document.getElementById("codexCards"),
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
const aim = new THREE.Vector3(0, 0, -8);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

let scene;
let camera;
let renderer;
let state;
let lastTime = 0;
let animationId = 0;
let localPlayerId = "host";
let spectateIndex = 0;
let radialActive = false;
let radialChoice = "Hello!";
let selectedRoomKey = "";
let selectedCharacterId = "archer";
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
  pausedBy: null,
  waitingFor: null,
  lastSend: 0,
  restartVotes: new Set(),
};
let codexViewer = null;
let audio = {
  bgm: null,
  sounds: {},
  loaded: false,
  enabled: true,
};

const AUDIO_FILES = {
  archerAttack: "arrowsound.mp3",
  archerSkill: "arrowskillsound.mp3",
  witchAttack: "wicthmagicsound.mp3",
  witchSkill: "wicthskillsound.mp3",
  saberAttack: "swordsound.mp3",
  saberSkill: "swordskillsound.mp3",
  victory: "victory.mp3",
  gameover: "gameover.mp3",
  start: "gamestartsound.mp3",
  gemA: "keikenti.mp3",
  gemB: "keikenti1.mp3",
};

const CHARACTER_TYPES = {
  archer: { label: "アーチャー", color: 0x57c4a7, remoteColor: 0x5aa7ff },
  witch: { label: "ウィッチ", color: 0x8b5cf6, remoteColor: 0xb07cff },
  saber: { label: "セイバー", color: 0xd9dfe8, remoteColor: 0x91c7ff },
};

const CHARACTER_CODEX = [
  {
    id: "archer",
    role: "扱いやすい遠距離アタッカー",
    weapon: "マウス方向へ矢を連射します。矢の本数と貫通で前方火力が伸び、バックショットで背後も攻撃できます。",
    passive: "専用パッシブはまだありません。素直な射撃性能が持ち味です。",
    skill: "アローレイン: スペースキーで前方へ大量の矢を一気に放ちます。",
    upgrades: ["矢の本数 +1", "貫通 +1", "バックショット"],
  },
  {
    id: "witch",
    role: "範囲攻撃が得意な魔法アタッカー",
    weapon: "火炎弾のファイアを放ちます。弾速は控えめですが、命中時に周囲を巻き込みます。",
    passive: "魔力爆発: ファイアが命中すると範囲ダメージが発生します。ファイア巨大化を取るほど範囲と威力が伸びます。",
    skill: "魔女の大爆発: スペースキーで周囲を大きく爆発させます。",
    upgrades: ["ファイア +1", "魔法陣＜雷＞", "ファイア巨大化"],
  },
  {
    id: "saber",
    role: "近距離の前方制圧キャラクター",
    weapon: "2秒ごとにマウス方向へ100度の剣閃で薙ぎ払います。",
    passive: "近い敵をまとめて切れる代わりに、通常攻撃の間隔は長めです。",
    skill: "閃光三連斬り: 短い無敵時間を得て、前方へ強力な三連続剣閃を放ちます。",
    upgrades: ["剣閃範囲 +20度", "剣の間合い +15%", "二連斬り"],
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
  boss: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.6, emissive: 0x1b0f38 }),
  arrow: new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.28, metalness: 0.15 }),
  magic: new THREE.MeshStandardMaterial({ color: 0xff6b2c, roughness: 0.28, emissive: 0x7a1b05 }),
  bullet: new THREE.MeshStandardMaterial({ color: 0xff7a42, roughness: 0.35, emissive: 0x3a1206 }),
  gem: new THREE.MeshStandardMaterial({ color: 0x58d5b7, roughness: 0.2, emissive: 0x0d4739 }),
  shooterGem: new THREE.MeshStandardMaterial({ color: 0x4aa3ff, roughness: 0.2, emissive: 0x082c62 }),
  heart: new THREE.MeshStandardMaterial({ color: 0xff4f7b, roughness: 0.35, emissive: 0x4a0618 }),
  ring: new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.75 }),
};

const upgrades = [
  { name: "矢の本数 +1", desc: "一度に放つ矢が増える。近距離の制圧力が上がる。", apply: (p) => (p.arrows += 1) },
  { name: "攻撃速度 +18%", desc: "矢を撃つ間隔が短くなる。迷ったらこれ。", apply: (p) => (p.fireRate *= 0.82) },
  { name: "ダメージ +25%", desc: "全ての矢の威力が増える。硬い敵に効く。", apply: (p) => (p.damage *= 1.25) },
  { name: "貫通 +1", desc: "矢が追加で敵を貫く。群れに強い。", apply: (p) => (p.pierce += 1) },
  { name: "移動速度 +15%", desc: "包囲されにくくなり、経験値回収も楽になる。", apply: (p) => (p.speed *= 1.15) },
  { name: "最大HP +25", desc: "最大HPが増え、少し回復する。", apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { name: "吸血", desc: "敵を倒すたびにHPを少し回復する。", apply: (p) => (p.lifeSteal += 1.2) },
  { name: "バックショット", desc: "通常攻撃と同時に、マウス方向の逆へ矢を撃つ。複数取ると後ろ矢が増える。", apply: (p) => (p.backShots += 1) },
  { name: "磁力 +40%", desc: "経験値を吸い寄せる範囲が広がる。", apply: (p) => (p.magnet *= 1.4) },
];

upgrades[0].classes = ["archer"];
upgrades[3].classes = ["archer"];
upgrades[7].classes = ["archer"];
upgrades.push(
  { name: "ファイア +1", desc: "ウィッチのファイアが同時に1つ増える。散らして撃てるので群れに強い。", classes: ["witch"], apply: (p) => (p.magicBolts += 1) },
  { name: "魔法陣＜雷＞", desc: "自分の周辺に雷の魔法陣を設置する。取得するたび範囲と設置時間が伸びる。", classes: ["witch"], apply: (p) => (p.thunderCircle += 1) },
  { name: "ファイア巨大化", desc: "ファイアが大きくなり、魔力爆発の範囲と威力も伸びる。", classes: ["witch"], apply: (p) => { p.magicRadius += 0.12; p.damage *= 1.08; p.magicSplash += 1; } },
  { name: "剣閃範囲 +20度", desc: "セイバーの薙ぎ払い角度が広くなる。", classes: ["saber"], apply: (p) => (p.slashArc += THREE.MathUtils.degToRad(20)) },
  { name: "剣の間合い +15%", desc: "セイバーの薙ぎ払いが遠くまで届く。", classes: ["saber"], apply: (p) => (p.slashRange *= 1.15) },
  { name: "二連斬り", desc: "薙ぎ払いの直後に、少しずらした追加の斬撃を放つ。", classes: ["saber"], apply: (p) => (p.doubleSlash += 1) }
);

initThree();
state = newState([{ id: localPlayerId, name: playerName(), character: selectedCharacter() }]);
render();
updateUi();
updateOnlineBadge();
renderRoomList();

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101419);
  scene.fog = new THREE.Fog(0x101419, 42, 86);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 160);
  camera.position.set(0, 25, 25);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xdde9ff, 0x1b1713, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-14, 32, 18);
  sun.castShadow = true;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.half * 2, WORLD.half * 2, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.9, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(WORLD.half * 2, 28, 0x48606a, 0x29343a);
  grid.position.y = 0.03;
  scene.add(grid);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x384049, roughness: 0.8 });
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
  }

  resize();
  window.addEventListener("resize", resize);
}

function newState(playerInfos) {
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
    heartTimer: 8 + Math.random() * 12,
    pauseReason: null,
    pendingLevel: null,
    players,
    enemies: [],
    arrows: [],
    enemyBullets: [],
    gems: [],
    hearts: [],
    magicCircles: [],
    effects: [],
    kills: 0,
    renderCache: { players: new Map(), enemies: new Map(), arrows: new Map(), bullets: new Map(), gems: new Map(), hearts: new Map(), circles: new Map(), effects: new Map() },
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
    fireRate: 0.45,
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
    thunderCircle: 0,
    thunderTimer: 2.8,
    slashArc: THREE.MathUtils.degToRad(100),
    slashRange: 5.2,
    doubleSlash: 0,
    mesh: makePlayerMesh(name, local, type),
  };
  if (type === "witch") {
    player.damage = 14;
    player.fireRate = 0.8;
    player.speed = 9.0;
    player.magicSplash = 1;
  } else if (type === "saber") {
    player.damage = 34;
    player.fireRate = 2;
    player.speed = 9.8;
    player.arrows = 0;
    player.pierce = 0;
  }
  return player;
}

function makePlayerMesh(name, local, character = "archer") {
  const group = new THREE.Group();
  const type = CHARACTER_TYPES[character] ? character : "archer";
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
  }

  const label = makeNameLabel(name);
  label.position.y = 3.35;
  group.add(label);
  addCharacterProps(group, type, bodyMat);
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
  return group;
}

function addCharacterProps(group, character, bodyMat) {
  if (character === "witch") {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.08, 24), materials.witchHat);
    brim.position.y = 2.48;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.82, 24), materials.witchHat);
    cone.position.y = 2.9;
    cone.rotation.z = -0.18;
    group.add(brim, cone);
    return;
  }
  if (character === "saber") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.08), materials.saberBlade);
    blade.name = "saberBlade";
    blade.position.set(0.7, 1.25, -0.18);
    blade.rotation.z = -0.45;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.12), bodyMat);
    guard.position.set(0.52, 0.83, -0.08);
    guard.rotation.z = -0.45;
    group.add(blade, guard);
    return;
  }
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 8, 24, Math.PI * 1.35), materials.arrow);
  bow.position.set(-0.62, 1.35, 0.05);
  bow.rotation.set(Math.PI / 2, 0, -0.65);
  group.add(bow);
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
  if (state) resetSceneEntities();
  net.mode = mode;
  net.phase = "playing";
  net.pausedBy = null;
  net.waitingFor = null;
  net.restartVotes = new Set();
  if (mode !== "client") localPlayerId = "host";
  const players = mode === "host" && net.lobbyPlayers.length ? net.lobbyPlayers : [{ id: localPlayerId, name: playerName(), character: selectedCharacter() }];
  state = newState(players);
  state.running = true;
  lastTime = performance.now();
  initAudio();
  sfx("start");
  startBgm();
  ui.start.classList.add("hidden");
  ui.lobby.classList.add("hidden");
  ui.levelUp.classList.add("hidden");
  ui.gameOver.classList.add("hidden");
  ui.skillText.closest(".skill-hud")?.classList.remove("hidden");
  hideStatus();
  updateUi();
  updateOnlineBadge();
  animationId = requestAnimationFrame(loop);
  if (mode === "host") broadcast({ type: "start", players: net.lobbyPlayers });
}

function resetSceneEntities() {
  for (const player of state.players) scene.remove(player.mesh);
  for (const group of [state.enemies, state.arrows, state.enemyBullets, state.gems, state.hearts, state.magicCircles, state.effects]) {
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
  updateGems(dt);
  updateHearts(dt);
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
    const moving = Math.hypot(player.input.dx, player.input.dz) > 0.01;
    player.x = clamp(player.x + player.input.dx * player.speed * dt, -WORLD.half + 1.2, WORLD.half - 1.2);
    player.z = clamp(player.z + player.input.dz * player.speed * dt, -WORLD.half + 1.2, WORLD.half - 1.2);
    player.mesh.position.set(player.x, 0, player.z);

    const angle = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
    player.mesh.rotation.y = angle;
    animateHuman(player, moving, dt);

    player.fireTimer -= dt;
    if (player.fireTimer <= 0) {
      shoot(player);
      player.fireTimer = player.fireRate;
    }
    updatePlayerThunderCircle(player, dt);
  }
}

function updatePlayerThunderCircle(player, dt) {
  if ((player.thunderCircle || 0) <= 0) return;
  player.thunderTimer = (player.thunderTimer || 0) - dt;
  if (player.thunderTimer > 0) return;
  addMagicCircle(player);
  player.thunderTimer = Math.max(4.2, 9.5 - player.thunderCircle * 0.45);
}

function updatePlayerFlash(player, dt) {
  player.hitFlash = Math.max(0, (player.hitFlash || 0) - dt);
  const invincible = state.elapsed < (player.invincibleUntil || 0);
  const flashing = player.hitFlash > 0 || invincible;
  const pulse = Math.sin(state.elapsed * 38) > 0;
  setPlayerFlash(player.mesh, flashing && pulse);
}

function setPlayerFlash(mesh, active) {
  for (const child of mesh.children) {
    if (!child.material || !child.material.emissive) continue;
    child.material.emissive.setHex(active ? 0xff2b2b : 0x000000);
  }
}

function setPlayerDeadVisual(player, dead) {
  const parts = player.mesh.userData.parts;
  if (!parts) return;
  for (const child of player.mesh.children) {
    if (child === parts.coffin || child.type === "Sprite") continue;
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
  let dx = 0;
  let dz = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) dz -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) dz += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
  const len = Math.hypot(dx, dz) || 1;
  return { dx: dx / len, dz: dz / len, aimX: aim.x, aimZ: aim.z };
}

function animateHuman(player, moving, dt) {
  animateHumanMesh(player.mesh, moving, dt);
}

function animateHumanMesh(mesh, moving, dt) {
  const parts = mesh.userData.parts;
  if (!parts) return;
  mesh.userData.walkTime = (mesh.userData.walkTime || 0) + (moving ? dt * 10 : dt * 3);
  const swing = moving ? Math.sin(mesh.userData.walkTime) * 0.55 : Math.sin(mesh.userData.walkTime) * 0.06;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
  mesh.position.y = moving ? Math.abs(Math.sin(mesh.userData.walkTime * 2)) * 0.05 : 0;
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
  camera.position.z += (player.z + 25 - camera.position.z) * 0.08;
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
      damage: player.damage,
      pierce: 0,
      owner: player.id,
      kind: "magic",
      splash: player.magicSplash || 0,
      angle,
      hit: new Set(),
      mesh: makeProjectileMesh({ kind: "magic" }),
    };
    magic.mesh.scale.setScalar(magic.radius / 0.34);
    magic.mesh.position.set(magic.x, 1.1, magic.z);
    scene.add(magic.mesh);
    state.arrows.push(magic);
  }
}

function swingSaber(player) {
  const base = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  const swings = Math.max(1, 1 + (player.doubleSlash || 0));
  for (let i = 0; i < swings; i += 1) {
    const angle = base + (i === 0 ? 0 : (i % 2 === 0 ? -0.28 : 0.28));
    applySaberSlash(player, angle);
  }
}

function applySaberSlash(player, angle) {
  const range = player.slashRange || 5.2;
  const arc = player.slashArc || THREE.MathUtils.degToRad(100);
  for (const enemy of state.enemies) {
    const d = distance(player, enemy);
    if (d > range + enemy.radius) continue;
    const toEnemy = Math.atan2(enemy.x - player.x, enemy.z - player.z);
    if (Math.abs(angleDiff(toEnemy, angle)) > arc / 2) continue;
    enemy.hp -= player.damage;
    enemy.lastHitBy = player.id;
  }
  addSlashEffect(player.x, player.z, range, arc, angle, 0xdfe8f3, player.id);
}

function requestSkillUse() {
  const player = localPlayer();
  if (!canUseSkill(player)) return;
  if (net.mode === "client") {
    sfx(skillSoundKey(player.character));
    sendToHost({ type: "skill", id: localPlayerId });
    return;
  }
  activateSkill(player);
  if (net.mode === "host") sendHostSnapshot(true);
}

function attackSoundKey(character) {
  if (character === "witch") return "witchAttack";
  if (character === "saber") return "saberAttack";
  return "archerAttack";
}

function skillSoundKey(character) {
  if (character === "witch") return "witchSkill";
  if (character === "saber") return "saberSkill";
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
  sfx(skillSoundKey(player.character));
  const angle = Math.atan2(player.input.aimX - player.x, player.input.aimZ - player.z);
  if (player.character === "witch") castWitchSkill(player);
  else if (player.character === "saber") castSaberSkill(player, angle);
  else castArcherSkill(player, angle);
  showToast(`${player.name}: ${skillName(player.character)}`);
  if (net.mode === "host") broadcast({ type: "toast", text: `${player.name}: ${skillName(player.character)}` });
  return true;
}

function skillName(character) {
  if (character === "witch") return "魔女の大爆発";
  if (character === "saber") return "閃光三連斬り";
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
      vx: Math.sin(angle) * 30,
      vz: Math.cos(angle) * 30,
      radius: 0.25,
      life: 1.95,
      damage: player.damage * 1.25,
      pierce: Math.max(1, player.pierce + 1),
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
  const damage = player.damage * (3.2 + (player.magicSplash || 0) * 0.18);
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
  const arc = THREE.MathUtils.degToRad(128);
  const range = (player.slashRange || 5.2) * 1.65;
  const damage = player.damage * 1.45;
  player.invincibleUntil = Math.max(player.invincibleUntil || 0, state.elapsed + 1.2);
  for (const offset of [-0.42, 0, 0.42]) {
    for (const enemy of state.enemies) {
      const d = distance(player, enemy);
      if (d > range + enemy.radius) continue;
      const toEnemy = Math.atan2(enemy.x - player.x, enemy.z - player.z);
      if (Math.abs(angleDiff(toEnemy, baseAngle + offset)) > arc / 2) continue;
      enemy.hp -= damage;
      enemy.lastHitBy = player.id;
    }
    addSlashEffect(player.x, player.z, range, arc, baseAngle + offset, 0x91c7ff, player.id, true);
  }
}

function spawnEnemies(dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;
  const pressure = Math.min(1.4, state.elapsed / 105);
  state.spawnTimer = Math.max(0.24, (0.72 - pressure * 0.34) / 0.75);
  const count = state.elapsed > 85 ? 4 : state.elapsed > 40 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const shooter = state.elapsed > 18 && Math.random() < Math.min(0.12, 0.03 + state.elapsed / 960);
    addEnemy(false, shooter);
  }
  if (state.elapsed > 150 && !state.bossSpawned) {
    state.bossSpawned = true;
    addEnemy(true, false);
  }
}

function addEnemy(boss, shooter) {
  const edge = Math.floor(Math.random() * 4);
  const pos = [
    { x: -WORLD.half, z: randomEdge() },
    { x: WORLD.half, z: randomEdge() },
    { x: randomEdge(), z: -WORLD.half },
    { x: randomEdge(), z: WORLD.half },
  ][edge];
  const scale = 1 + state.elapsed / 155;
  const redXp = 5 + Math.floor(scale * 2);
  const enemy = {
    id: crypto.randomUUID(),
    x: pos.x,
    z: pos.z,
    radius: boss ? 1.9 : shooter ? 1.05 : 0.72 + Math.random() * 0.28,
    hp: boss ? 980 : shooter ? 46 * scale : 28 * scale,
    maxHp: boss ? 980 : shooter ? 46 * scale : 28 * scale,
    speed: boss ? 2.4 : shooter ? 2.1 + state.elapsed * 0.006 : 2.8 + Math.random() * 1.7 + state.elapsed * 0.01,
    damage: boss ? 22 : shooter ? 12 : 9,
    touchTimer: 0,
    shotTimer: shooter ? 1.2 + Math.random() * 1.4 : 0,
    xp: boss ? 90 : shooter ? redXp * 3 : redXp,
    boss,
    shooter,
  };
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
    enemy.x += Math.sin(angle) * enemy.speed * dir * dt;
    enemy.z += Math.cos(angle) * enemy.speed * dir * dt;
    enemy.touchTimer -= dt;
    enemy.mesh.position.set(enemy.x, enemy.radius, enemy.z);
    enemy.mesh.rotation.y += dt * (enemy.boss ? 1.2 : 2.6);

    if (enemy.shooter) {
      enemy.shotTimer -= dt;
      if (enemy.shotTimer <= 0) {
        shootEnemyBullet(enemy, target);
        enemy.shotTimer = 1.65 + Math.random() * 0.7;
      }
    }

    if (distance(enemy, target) < enemy.radius + target.radius && enemy.touchTimer <= 0) {
      damagePlayer(target, enemy.damage);
      enemy.touchTimer = 0.55;
      addRing(target.x, target.z, 1.6, 0xd95f59);
    }
  }

  const dead = state.enemies.filter((enemy) => enemy.hp <= 0);
  for (const enemy of dead) {
    state.kills += 1;
    dropGem(enemy.x, enemy.z, enemy.xp, enemy.shooter ? "shooter" : "normal");
    const owner = state.players.find((p) => p.id === enemy.lastHitBy) || localPlayer();
    if (owner) owner.hp = Math.min(owner.maxHp, owner.hp + owner.lifeSteal);
    addRing(enemy.x, enemy.z, enemy.boss ? 3.2 : 1.4, enemy.shooter ? 0x3fb7d6 : enemy.boss ? 0x57c4a7 : 0xf2c14e);
  }
  removeDead(state.enemies, (enemy) => enemy.hp <= 0);
}

function shootEnemyBullet(enemy, target) {
  const angle = Math.atan2(target.x - enemy.x, target.z - enemy.z);
  const bullet = {
    id: crypto.randomUUID(),
    x: enemy.x,
    z: enemy.z,
    vx: Math.sin(angle) * 11,
    vz: Math.cos(angle) * 11,
    radius: 0.34,
    damage: enemy.damage * 0.5,
    life: 4,
    mesh: makeBulletMesh(),
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
    bullet.mesh.rotation.y += dt * 6;
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
      player.hitFlash = 2;
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
    for (const enemy of state.enemies) {
      if (arrow.hit.has(enemy)) continue;
      if (distance(arrow, enemy) < arrow.radius + enemy.radius) {
        enemy.hp -= arrow.damage;
        enemy.lastHitBy = arrow.owner;
        arrow.hit.add(enemy);
        if (arrow.kind === "magic") sfx("fire");
        addRing(enemy.x, enemy.z, arrow.kind === "magic" ? 1.0 : 0.8, arrow.kind === "magic" ? 0xff6b2c : 0xf2c14e);
        if (arrow.kind === "magic" && arrow.splash > 0) {
          const splashRadius = 1.4 + arrow.splash * 0.42;
          const splashDamage = arrow.damage * (0.35 + arrow.splash * 0.14);
          explode(enemy.x, enemy.z, splashRadius, splashDamage);
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

function dropGem(x, z, value, kind = "normal") {
  const gem = { id: crypto.randomUUID(), x, z, value, kind, radius: 0.42, wobble: Math.random() * Math.PI * 2, mesh: makeGemMesh({ kind }) };
  gem.mesh.position.set(x, 0.55, z);
  scene.add(gem.mesh);
  state.gems.push(gem);
}

function updateGems(dt) {
  for (const gem of state.gems) {
    const player = nearestGemPlayer(gem);
    if (!player) continue;
    const d = distance(gem, player);
    if (d < player.magnet) {
      const angle = Math.atan2(player.x - gem.x, player.z - gem.z);
      const speed = 7 + (1 - d / player.magnet) * 16;
      gem.x += Math.sin(angle) * speed * dt;
      gem.z += Math.cos(angle) * speed * dt;
    }
    gem.mesh.position.set(gem.x, 0.55 + Math.sin(state.elapsed * 5 + gem.wobble) * 0.18, gem.z);
    gem.mesh.rotation.y += dt * 2.8;
    gem.mesh.rotation.x += dt * 1.4;
    if (d < player.radius + gem.radius) {
      player.xp += gem.value;
      gem.collected = true;
      if (player.local) sfx("gem");
      while (player.xp >= player.xpNext) {
        player.xp -= player.xpNext;
        player.level += 1;
        player.xpNext = Math.floor(player.xpNext * 1.28 + 7);
        if (player.local) sfx("level");
        openLevelUp(player);
      }
    }
  }
  removeDead(state.gems, (gem) => gem.collected);
}

function spawnHeart() {
  const heart = {
    id: crypto.randomUUID(),
    x: randomEdge() * 0.88,
    z: randomEdge() * 0.88,
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
        if (player.local) sfx("heal");
        addRing(player.x, player.z, 1.8, 0xff4f7b);
        break;
      }
    }
  }
  removeDead(state.hearts, (heart) => heart.collected);
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
    owner: player.id,
    damage: player.damage * (0.75 + level * 0.16),
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
    const pulse = 0.92 + Math.sin(state.elapsed * 9) * 0.06;
    circle.mesh.scale.setScalar(pulse);
    if (circle.tick <= 0) {
      circle.tick = 0.62;
      for (const enemy of state.enemies) {
        if (distance(circle, enemy) <= circle.radius + enemy.radius) {
          enemy.hp -= circle.damage;
          enemy.lastHitBy = circle.owner;
          addRing(enemy.x, enemy.z, 0.85, 0x7dd3fc);
        }
      }
    }
  }
  removeDead(state.magicCircles, (circle) => circle.life <= 0);
}

function explode(x, z, radius, damage) {
  sfx("explode");
  addRing(x, z, radius, 0xe8784f);
  for (const enemy of state.enemies) {
    if (distance({ x, z }, enemy) < radius + enemy.radius) enemy.hp -= damage;
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
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(enemy.radius, enemy.boss ? 24 : 16, enemy.boss ? 16 : 10),
    enemy.boss ? materials.boss : enemy.shooter ? materials.shooter : materials.enemy
  );
  mesh.position.set(enemy.x, enemy.radius, enemy.z);
  mesh.castShadow = true;
  return mesh;
}

function makeArrowMesh() {
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
  return item.kind === "magic" ? makeMagicMesh() : makeArrowMesh();
}

function makeBulletMesh() {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), materials.bullet);
  mesh.castShadow = true;
  return mesh;
}

function makeGemMesh(gem = {}) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), gem.kind === "shooter" ? materials.shooterGem : materials.gem);
  mesh.castShadow = true;
  return mesh;
}

function makeHeartMesh() {
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

function addSlashEffect(x, z, radius, arc, angle, color, owner = "", skill = false) {
  const mesh = makeSlashMesh({ radius, arc, color });
  mesh.position.set(x, 0.18, z);
  mesh.rotation.y = angle;
  scene.add(mesh);
  state.effects.push({ id: crypto.randomUUID(), kind: "slash", owner, skill, x, z, radius, arc, angle, color, mesh, life: 0.22, start: 0.22 });
}

function makeSlashMesh(effect) {
  const radius = effect.radius || 5.2;
  const arc = effect.arc || THREE.MathUtils.degToRad(100);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 28;
  for (let i = 0; i <= steps; i += 1) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * radius, Math.cos(a) * radius);
  }
  shape.lineTo(0, 0);
  const material = new THREE.MeshBasicMaterial({ color: effect.color || 0xdfe8f3, transparent: true, opacity: 0.46, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.life -= dt;
    const t = 1 - effect.life / effect.start;
    effect.mesh.scale.setScalar(1 + t * 0.8);
    effect.mesh.material.opacity = Math.max(0, 0.75 * (1 - t));
  }
  removeDead(state.effects, (effect) => effect.life <= 0);
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
  if (state.elapsed >= 180 && state.bossSpawned && !state.enemies.some((enemy) => enemy.boss)) endGame(true);
}

function oldEndGame(won) {
  state.running = false;
  state.won = won;
  net.phase = "gameover";
  ui.endTitle.textContent = won ? "Clear!" : "Game Over";
  ui.endText.textContent = `${formatTime(state.elapsed)} 生存 / ${state.kills}体撃破 / レベル${localPlayer()?.level || 1}`;
  ui.restartButton.textContent = net.mode === "solo" ? "もう一度" : "同じメンバーでもう一度";
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
  audio.bgm = new Audio("./Sounds/gamebgm.mp3");
  audio.bgm.loop = true;
  audio.bgm.volume = 0.42;
  for (const [key, file] of Object.entries(AUDIO_FILES)) {
    audio.sounds[key] = new Audio(`./Sounds/${file}`);
    audio.sounds[key].preload = "auto";
  }
  audio.loaded = true;
}

function startBgm() {
  initAudio();
  if (!audio.bgm) return;
  audio.bgm.currentTime = 0;
  audio.bgm.play().catch(() => {});
}

function stopBgm() {
  if (!audio.bgm) return;
  audio.bgm.pause();
  audio.bgm.currentTime = 0;
}

function sfx(kind) {
  initAudio();
  if (kind === "gem") kind = Math.random() < 0.5 ? "gemA" : "gemB";
  const base = audio.sounds[kind];
  if (!base) return;
  const sound = base.cloneNode();
  sound.volume = 0.78;
  sound.play().catch(() => {});
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
  codexViewer = { scene: codexScene, camera: codexCamera, renderer: codexRenderer, model: null, rotation: 0, dragging: false, lastX: 0, raf: 0 };
  buildCodexCards();
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
  if (codexViewer.model) codexViewer.scene.remove(codexViewer.model);
  codexViewer.model = makePlayerMesh(CHARACTER_TYPES[info.id].label, true, info.id);
  codexViewer.model.scale.setScalar(1.25);
  codexViewer.model.position.y = -0.08;
  codexViewer.rotation = 0;
  codexViewer.scene.add(codexViewer.model);
  ui.codexName.textContent = CHARACTER_TYPES[info.id].label;
  ui.codexRole.textContent = info.role;
  ui.codexWeapon.textContent = info.weapon;
  ui.codexPassive.textContent = info.passive;
  ui.codexSkill.textContent = info.skill || "";
  ui.codexUpgrades.innerHTML = info.upgrades.map((upgrade) => `<li>${upgrade}</li>`).join("");
  for (const button of ui.codexCards.querySelectorAll("[data-character]")) {
    button.classList.toggle("selected", button.dataset.character === info.id);
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
  const recent = player.upgrades.length ? player.upgrades.slice(-5).join(" / ") : "強化なし";
  const room = net.roomCode ? ` / 部屋:${net.roomCode}` : "";
  const revive = player.dead ? ` / 復活まで${Math.max(0, Math.ceil(player.reviveAt - state.elapsed))}秒` : "";
  const characterName = CHARACTER_TYPES[player.character || "archer"]?.label || "アーチャー";
  const weapon = player.character === "saber"
    ? `薙ぎ払い${Math.round(THREE.MathUtils.radToDeg(player.slashArc || 0))}度`
    : player.character === "witch"
      ? `ファイア${player.magicBolts || 1}発`
      : `${player.arrows}本 / 後方${player.backShots || 0}本 / 貫通${player.pierce}`;
  ui.build.textContent = `${characterName} / ${weapon} / 威力${Math.round(player.damage)} / ${recent}${room}${revive}`;
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
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, aim);
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
  const password = ui.roomPasswordInput.value.trim();
  const code = roomKey(roomName);
  localPlayerId = "host";
  net.mode = "host";
  net.phase = "lobby";
  net.roomCode = code;
  net.roomName = roomName;
  net.roomPassword = password;
  net.lobbyPlayers = [{ id: localPlayerId, name: playerName(), character: selectedCharacter(), host: true }];
  selectedRoomKey = code;
  rememberRoom({ code, name: roomName, host: playerName(), hasPassword: Boolean(password), password });
  renderRoomList();
  ui.roomStatus.textContent = `準備中: ${code}`;
  net.peer = new Peer(`vansaba-${code}`);
  net.peer.on("open", () => showLobby("ホストです。参加者が揃ったら開始してください。"));
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
  ui.lobbyCode.textContent = `パスワード: ${net.roomCode}`;
  ui.lobbyStatus.textContent = message;
  ui.lobbyStartButton.classList.toggle("hidden", net.mode !== "host");
  renderLobbyPlayers();
}

function renderLobbyPlayers() {
  ui.lobbyPlayers.innerHTML = "";
  for (const player of net.lobbyPlayers) {
    const row = document.createElement("div");
    row.className = "lobby-player";
    row.innerHTML = `<span>${player.name}</span><span>${player.host ? "ホスト" : "参加"}</span>`;
    const className = CHARACTER_TYPES[player.character || "archer"]?.label || "アーチャー";
    row.innerHTML = `<span>${player.name} / ${className}</span><span>${player.host ? "Host" : "Guest"}</span>`;
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
      conn.send({ type: "start", players: state.players.map((p) => ({ id: p.id, name: p.name, character: p.character })) });
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
  if (data.type === "skill") {
    const player = state.players.find((p) => p.id === data.id);
    if (player && activateSkill(player)) sendHostSnapshot(true);
  }
}

function handleHostData(data) {
  if (!data) return;
  if (data.type === "lobby") {
    net.lobbyPlayers = data.players || [];
    if (net.phase === "playing") {
      updateOnlineBadge();
      return;
    }
    showLobby("ホストの開始を待っています。");
  }
  if (data.type === "start") {
    net.phase = "playing";
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
    state = newState(data.players || [{ id: localPlayerId, name: playerName() }]);
    state.running = true;
    ui.restartButton.disabled = false;
    updateOnlineBadge();
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }
  if (data.type === "snapshot") applySnapshot(data);
  if (data.type === "pause") {
    if (data.paused) applyPause(data.id);
    else clearPause();
  }
  if (data.type === "toast") showToast(data.text);
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
    ui.endTitle.textContent = data.won ? "Clear!" : "Game Over";
    ui.endText.textContent = `${formatTime(data.elapsed)} 生存 / ${data.kills}体撃破`;
    ui.restartButton.textContent = "同じメンバーでもう一度";
    ui.disbandButton.classList.remove("hidden");
    ui.gameOver.classList.remove("hidden");
  }
  if (data.type === "gameOver") {
    ui.restartButton.textContent = "もう一度に投票";
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
  syncSimpleMeshes(state.renderCache.circles, data.circles || [], makeMagicCircleMesh, 0.1);
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
      angle: Math.atan2((p.input?.aimX ?? p.x) - p.x, (p.input?.aimZ ?? p.z - 1) - p.z),
      skillCharge: p.skillCharge, skillCooldown: p.skillCooldown,
      arrows: p.arrows, backShots: p.backShots, damage: p.damage, pierce: p.pierce,
      magicSplash: p.magicSplash, magicRadius: p.magicRadius, thunderCircle: p.thunderCircle,
      rerolls: p.rerolls, upgrades: p.upgrades,
    })),
    enemies: state.enemies.map((e) => ({ id: e.id, x: e.x, z: e.z, radius: e.radius, boss: e.boss, shooter: e.shooter })),
    arrows: state.arrows.map((a) => ({ id: a.id, x: a.x, z: a.z, angle: a.angle, kind: a.kind, radius: a.radius, owner: a.owner, skill: a.skill })),
    bullets: state.enemyBullets.map((b) => ({ id: b.id, x: b.x, z: b.z })),
    gems: state.gems.map((g) => ({ id: g.id, x: g.x, z: g.z, kind: g.kind })),
    hearts: state.hearts.map((h) => ({ id: h.id, x: h.x, z: h.z })),
    circles: state.magicCircles.map((c) => ({ id: c.id, x: c.x, z: c.z, radius: c.radius, life: c.life, duration: c.duration })),
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
      animateHuman(existingPlayer, Math.hypot(p.input?.dx || 0, p.input?.dz || 0) > 0.01, 0.033);
      setPlayerFlash(existingPlayer.mesh, ((p.hitFlash || 0) > 0 || state.elapsed < (p.invincibleUntil || 0)) && Math.sin(state.elapsed * 38) > 0);
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
    animateHumanMesh(mesh, Math.hypot(p.input?.dx || 0, p.input?.dz || 0) > 0.01, 0.033);
    setPlayerFlash(mesh, ((p.hitFlash || 0) > 0 || state.elapsed < (p.invincibleUntil || 0)) && Math.sin(state.elapsed * 38) > 0);
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
      if (item.owner === localPlayerId && !item.skill) sfx(item.kind === "magic" ? "witchAttack" : "archerAttack");
    }
    mesh.position.set(item.x, y || item.radius || 0.6, item.z);
    if (typeof item.angle === "number") mesh.rotation.y = item.angle;
    if (item.kind === "magic") mesh.scale.setScalar((item.radius || 0.34) / 0.34);
  }
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
      mesh = effect.kind === "slash" ? makeSlashMesh(effect) : makeRingMesh(effect);
      scene.add(mesh);
      cache.set(effect.id, mesh);
      if (effect.kind === "slash" && effect.owner === localPlayerId && !effect.skill) sfx("saberAttack");
    }
    const t = 1 - effect.life / effect.start;
    mesh.position.set(effect.x, 0.12, effect.z);
    if (typeof effect.angle === "number") mesh.rotation.y = effect.angle;
    mesh.scale.setScalar(1 + t * 0.8);
    mesh.material.opacity = Math.max(0, 0.75 * (1 - t));
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
  broadcast({ type: "lobby", players: net.lobbyPlayers });
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

function closeConnections() {
  if (net.conn) net.conn.close();
  for (const conn of net.clients.values()) conn.close();
  if (net.peer) net.peer.destroy();
  net = { mode: "solo", phase: "menu", peer: null, conn: null, clients: new Map(), lobbyPlayers: [], roomCode: "", roomName: "", roomPassword: "", pausedBy: null, waitingFor: null, lastSend: 0, restartVotes: new Set() };
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
  return state.players.filter((p) => !p.dead && p.hp > 0).sort((a, b) => distance(source, a) - distance(source, b))[0];
}

function nearestGemPlayer(gem) {
  return state.players.filter((p) => !p.dead && p.hp > 0).sort((a, b) => distance(gem, a) - distance(gem, b))[0];
}

function playerNameById(id) {
  return state.players.find((p) => p.id === id)?.name || net.lobbyPlayers.find((p) => p.id === id)?.name || "他のプレイヤー";
}

function playerName() {
  return ui.playerName.value.trim().slice(0, 14) || "Player";
}

function selectedCharacter() {
  return CHARACTER_TYPES[selectedCharacterId] ? selectedCharacterId : "archer";
}

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
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
  return shuffle(upgrades.filter((up) => !up.classes || up.classes.includes(character))).slice(0, 3).map((up) => up.name);
}

function endGame(won) {
  state.running = false;
  state.won = won;
  net.phase = "gameover";
  stopBgm();
  sfx(won ? "victory" : "gameover");
  ui.skillText.closest(".skill-hud")?.classList.add("hidden");
  net.restartVotes = new Set();
  ui.endTitle.textContent = won ? "Clear!" : "Game Over";
  ui.endText.textContent = `${formatTime(state.elapsed)} 生存 / ${state.kills}体撃破 / レベル${localPlayer()?.level || 1}`;
  ui.restartButton.textContent = net.mode === "solo" ? "もう一度" : "もう一度に投票";
  ui.disbandButton.textContent = net.mode === "solo" ? "タイトルに戻る" : "解散する";
  ui.voteText.textContent = net.mode === "solo" ? "" : `再戦投票: 0/${state.players.length}`;
  ui.disbandButton.classList.remove("hidden");
  ui.gameOver.classList.remove("hidden");
  if (net.mode === "host") broadcast({ type: "gameOver", won, elapsed: state.elapsed, kills: state.kills, total: state.players.length });
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

function updateOnlineBadge() {
  if (!ui.onlineBadge) return;
  const count = net.mode === "solo" ? 1 : Math.max(1, net.lobbyPlayers.length || state.players?.length || 1);
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
  const leaving = playerNameById(id);
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

function joinRoom() {
  if (!window.Peer) {
    ui.roomStatus.textContent = "PeerJSを読み込めませんでした。";
    return;
  }
  initAudio();
  const room = selectedRoom();
  const roomName = room?.name || ui.roomNameInput.value.trim();
  if (room?.hasPassword && ui.joinPasswordInput.value.trim() === "") {
    ui.joinPasswordPanel.classList.remove("hidden");
    ui.joinPasswordLabel.textContent = `${room.name} はパスワードが必要です。`;
    ui.roomStatus.textContent = "パスワードを入力してください。";
    return;
  }
  const password = ui.joinPasswordPanel.classList.contains("hidden")
    ? (ui.roomPasswordInput.value.trim() || room?.password || "")
    : ui.joinPasswordInput.value.trim();
  const code = room?.code || roomKey(roomName);
  if (!roomName) {
    ui.roomStatus.textContent = "参加する部屋を選択するか、部屋名を入力してください。";
    return;
  }
  closeConnections();
  net.mode = "client";
  net.phase = "lobby";
  net.roomCode = code;
  net.roomName = roomName;
  net.roomPassword = password;
  localPlayerId = `guest-${Math.random().toString(36).slice(2, 7)}`;
  net.peer = new Peer();
  net.peer.on("open", () => {
    net.conn = net.peer.connect(`vansaba-${code}`, { reliable: false });
    net.conn.on("open", () => {
      sendToHost({ type: "hello", id: localPlayerId, name: playerName(), character: selectedCharacter(), password });
      rememberRoom({ code, name: roomName, host: room?.host || "Unknown", hasPassword: Boolean(password), password });
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
  return loadRooms().find((room) => room.code === selectedRoomKey);
}

function renderRoomList() {
  if (!ui.roomList) return;
  const rooms = loadRooms();
  ui.roomList.innerHTML = "";
  if (!rooms.length) {
    ui.roomList.innerHTML = `<p class="small">表示できる部屋がありません。</p>`;
    return;
  }
  for (const room of rooms) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `room-card ${room.code === selectedRoomKey ? "selected" : ""}`;
    button.innerHTML = `<strong>${room.name}</strong><span>${room.hasPassword ? "鍵あり" : "鍵なし"}</span><small>ホスト: ${room.host}</small><small>ID: ${room.code}</small>`;
    button.addEventListener("click", () => {
      selectedRoomKey = room.code;
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
  stopBgm();
  ui.skillText.closest(".skill-hud")?.classList.add("hidden");
  ui.start.classList.remove("hidden");
  ui.createRoomPanel.classList.add("hidden");
  ui.joinRoomPanel.classList.add("hidden");
  ui.joinPasswordPanel.classList.add("hidden");
  ui.roomStatus.textContent = "部屋作成または参加を選んでください。";
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
    button.innerHTML = `<strong>${up.name}</strong><span>${upgradeDescForPlayer(up, player)}</span>`;
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
    if (character === "witch") return "ファイアと魔力爆発の威力が増える。硬い敵にも通しやすくなる。";
    if (character === "saber") return "薙ぎ払いの威力が増える。近づいた敵をまとめて倒しやすくなる。";
    return "全ての矢の威力が増える。硬い敵に効く。";
  }
  if (up.name === "攻撃速度 +18%") {
    if (character === "witch") return "ファイアを放つ間隔が短くなる。通常攻撃の回転率が上がる。";
    if (character === "saber") return "薙ぎ払いを出せる間隔が短くなる。隙を減らしやすい。";
    return "矢を撃つ間隔が短くなる。迷ったらこれ。";
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
  if (player && up) {
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
  if (event.code === "Escape") {
    event.preventDefault();
    togglePause();
    return;
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
ui.startButton.addEventListener("click", () => startGame("solo"));
ui.openCreateRoomButton.addEventListener("click", () => {
  ui.start.classList.add("hidden");
  ui.createRoomPanel.classList.remove("hidden");
});
ui.openJoinRoomButton.addEventListener("click", () => {
  ui.start.classList.add("hidden");
  ui.joinRoomPanel.classList.remove("hidden");
  ui.joinPasswordPanel.classList.add("hidden");
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
ui.updateButton.addEventListener("click", () => ui.updateInfo.classList.remove("hidden"));
ui.closeUpdateButton.addEventListener("click", () => ui.updateInfo.classList.add("hidden"));
ui.codexButton.addEventListener("click", openCharacterCodex);
ui.closeCodexButton.addEventListener("click", closeCharacterCodex);
if (ui.characterSelect) {
  for (const button of ui.characterSelect.querySelectorAll("[data-character]")) {
    button.addEventListener("click", () => {
      selectedCharacterId = button.dataset.character || "archer";
      for (const item of ui.characterSelect.querySelectorAll("[data-character]")) item.classList.toggle("selected", item === button);
      if (state) resetSceneEntities();
      state = newState([{ id: localPlayerId, name: playerName(), character: selectedCharacter() }]);
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
