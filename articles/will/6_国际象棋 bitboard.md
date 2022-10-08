# Bitboard (比特板)

Bitboard 是棋盘类游戏一种节省内存的实现方法，它通常用来实现国际象棋引擎。

为什么这样说呢？

因为 Bitboard 使用 二进制 、位运算符和位移运算符来完成棋子的移动、索引、吃子 等操作。

> 由于使用 位运算符的特性，它也很快，也很省内存，一个 int64 就代表一盘棋
> 又快又节省内存，国际象棋的不二之选（这种一般用来实现 AI 打比赛）

<br />

## 局限

Bitboard 虽然又快又省内存，但写定制 GUI 的业务时，就不适合使用，主要有以下几点：

1. 维护风险高(二进制和位运算是真不好调试)
2. 学习成本高(开发引擎的人跑路怎么办?)
3. 和千变万化的业务不契合(初期替代有风险), 作为一个基础库较为合适

像 `lichess` 网站的下棋直接使用的 `context + function`，怎么简单怎么来

<br />
<br />

## 理念

国际象棋的棋盘为 `8 * 8`，也就是 `64`

在 `bitboard` 中，使用 `u64` 来存储一个完成的棋盘

<br />

### 棋盘 与 棋子

> 在 JS 中，需要使用 `bigint` 来达到 `u64` 的效果

```ts
// 棋盘
const board = 0n;
```

<br />

#### 使用位运算符 `或 |` 来完成棋子标志位的叠加

1. 在 bitboard 中，每个棋格都要求不重复
   > 比如 `WHITE_PAWN` 变量，它在 n 位有值，正常逻辑下，其它棋子变量的 n 位一定为空
2. WHITE_PAWN 的第 n 位有值，就代表第 n 位为兵

1、2 组成在一起时，`WHITE_PAWN | WHITE_KNIGHT | WHITE_ROOK | WHITE_BISHOP | WHITE_QUEEN | WHITE_KING` 就表示白方所有的棋子，反之就是黑方所有的棋子

`WHITE_PIECES | BLACK_PIECES` 则组成棋盘上全部的棋子

> 存储王的变量甚至能去掉，直接放在 WHITE_PIECES 上，当 `n & (WHITE_PAWN | WHITE_KNIGHT | WHITE_ROOK | WHITE_BISHOP | WHITE_QUEEN) === 0` 且 `n & WHITE_PIECES !== 0` 时，这是，就可以认为是王

```ts
// 棋子

// 白
let [
  // 兵
  WHITE_PAWN,
  // 马
  WHITE_KNIGHT,
  // 车
  WHITE_ROOK,
  // 象
  WHITE_BISHOP,
  // 后
  WHITE_QUEEN,
  // 王
  WHITE_KING,
] = [0n, 0n, 0n, 0n, 0n, 0n];

// 黑
let [
  // 兵
  BLACK_PAWN,
  // 马
  BLACK_KNIGHT,
  // 车
  BLACK_ROOK,
  // 象
  BLACK_BISHOP,
  // 后
  BLACK_QUEEN,
  // 王
  BLACK_KING,
] = [0n, 0n, 0n, 0n, 0n, 0n];

let WHITE_PIECES =
  WHITE_PAWN |
  WHITE_KNIGHT |
  WHITE_ROOK |
  WHITE_BISHOP |
  WHITE_QUEEN |
  WHITE_KING;

let BLACK_PIECES =
  BLACK_PAWN |
  BLACK_KNIGHT |
  BLACK_ROOK |
  BLACK_BISHOP |
  BLACK_QUEEN |
  BLACK_KING;

let ALL_PIECES = WHITE_PIECES | BLACK_PIECES;
```

<br />

#### 声明棋子

```ts
export enum Pieces {
  PAWN = 1,
  ROOK,
  KNIGHT,
  BISHOP,
  QUEEN,
  KING,
}

export const PIECE_STR_MAP_ENUM: Record<string, Pieces> = {
  p: Pieces.PAWN,
  r: Pieces.ROOK,
  n: Pieces.KNIGHT,
  b: Pieces.BISHOP,
  q: Pieces.QUEEN,
  k: Pieces.KING,
  P: -Pieces.PAWN,
  R: -Pieces.ROOK,
  N: -Pieces.KNIGHT,
  B: -Pieces.BISHOP,
  Q: -Pieces.QUEEN,
  K: -Pieces.KING,
};

export const PIECE_ENUM_MAP_STR: Record<Pieces | number, string> = {
  [Pieces.PAWN]: "p",
  [Pieces.ROOK]: "r",
  [Pieces.KNIGHT]: "n",
  [Pieces.BISHOP]: "b",
  [Pieces.QUEEN]: "q",
  [Pieces.KING]: "k",
  [-Pieces.PAWN]: "P",
  [-Pieces.ROOK]: "R",
  [-Pieces.KNIGHT]: "N",
  [-Pieces.BISHOP]: "B",
  [-Pieces.QUEEN]: "Q",
  [-Pieces.KING]: "K",
};
```

<br />

#### 获取与棋子有关系的变量

当某个棋子移动时，所牵扯的范围变动

比如兵向前移动了一步，`兵自身、白方全部棋子、全局棋子` 都需要重新计算

> 通过 `WHITE_PAWN = WHITE_PAWN ^ 1n << n` 可以取消/添加棋子在第 n 位的标志位，所以不用牵扯到全部的变量重新计算一遍

```ts
function relation_ship_of_piece(piece: Pieces) {
  switch (piece) {
    case -Pieces.ROOK:
      return [WHITE_ROOK, WHITE_PIECES, ALL_PIECES];
    case -Pieces.PAWN:
      return [WHITE_PAWN, WHITE_PIECES, ALL_PIECES];
    case -Pieces.QUEEN:
      return [WHITE_QUEEN, WHITE_PIECES, ALL_PIECES];
    case -Pieces.KNIGHT:
      return [WHITE_KNIGHT, WHITE_PIECES, ALL_PIECES];
    case -Pieces.KING:
      return [WHITE_KING, WHITE_PIECES, ALL_PIECES];
    case -Pieces.BISHOP:
      return [WHITE_BISHOP, WHITE_PIECES, ALL_PIECES];
  }
  return [];
}
```

<br />

#### 地图相关的静态值

```ts
export type Square = keyof typeof SQUARE_MAP;

export const FEN_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

// prettier-ignore
export const SQUARE_MAP = {
    a8: 0,  b8: 1,  c8: 2,  d8: 3,  e8: 4,  f8: 5,  g8: 6,  h8: 7,
    a7: 8,  b7: 9,  c7: 10, d7: 11, e7: 12, f7: 13, g7: 14, h7: 15,
    a6: 16, b6: 17, c6: 18, d6: 19, e6: 20, f6: 21, g6: 22, h6: 23,
    a5: 24, b5: 25, c5: 26, d5: 27, e5: 28, f5: 29, g5: 30, h5: 31,
    a4: 32, b4: 33, c4: 34, d4: 35, e4: 36, f4: 37, g4: 38, h4: 39,
    a3: 40, b3: 41, c3: 42, d3: 43, e3: 44, f3: 45, g3: 46, h3: 47,
    a2: 48, b2: 49, c2: 50, d2: 51, e2: 52, f2: 53, g2: 54, h2: 55,
    a1: 56, b1: 57, c1: 58, d1: 59, e1: 60, f1: 61, g1: 62, h1: 63,
};
// prettier-ignore
export const SQUARE_INDEX_MAP: { [key: number]: Square } = {
    0: 'a8',  1: 'b8',  2: 'c8',  3: 'd8',  4: 'e8',  5: 'f8',  6: 'g8',  7: 'h8',
    8: 'a7',  9: 'b7',  10: 'c7', 11: 'd7', 12: 'e7', 13: 'f7', 14: 'g7', 15: 'h7',
    16: 'a6', 17: 'b6', 18: 'c6', 19: 'd6', 20: 'e6', 21: 'f6', 22: 'g6', 23: 'h6',
    24: 'a5', 25: 'b5', 26: 'c5', 27: 'd5', 28: 'e5', 29: 'f5', 30: 'g5', 31: 'h5',
    32: 'a4', 33: 'b4', 34: 'c4', 35: 'd4', 36: 'e4', 37: 'f4', 38: 'g4', 39: 'h4',
    40: 'a3', 41: 'b3', 42: 'c3', 43: 'd3', 44: 'e3', 45: 'f3', 46: 'g3', 47: 'h3',
    48: 'a2', 49: 'b2', 50: 'c2', 51: 'd2', 52: 'e2', 53: 'f2', 54: 'g2', 55: 'h2',
    56: 'a1', 57: 'b1', 58: 'c1', 59: 'd1', 60: 'e1', 61: 'f1', 62: 'g1', 63: 'h1',
}
```

<br />

#### 当我们要从 bitboard 中获取到指定的棋子时

当要获取 idx 位的棋子时，需要与所有棋子，进行 `与 (&)` 操作，如果不为 0 的话，表示其在某个棋子的标志位中，就可以判断是什么棋子啦

```ts
function piece_at(idx: number): Pieces | null {
  // @ts-ignore
  const pieces: bigint = ALL_PIECES;
  const offset = 1n << BigInt(idx);
  const t = pieces & offset;

  if (t) {
    const options = [
      [BLACK_BISHOP, Pieces.BISHOP],
      [BLACK_KNIGHT, Pieces.KNIGHT],
      [BLACK_PAWN, Pieces.PAWN],
      [BLACK_QUEEN, Pieces.QUEEN],
      [BLACK_ROOK, Pieces.ROOK],
      [BLACK_KING, Pieces.KING],
      [WHITE_BISHOP, Pieces.BISHOP],
      [WHITE_KNIGHT, Pieces.KNIGHT],
      [WHITE_PAWN, Pieces.PAWN],
      [WHITE_QUEEN, Pieces.QUEEN],
      [WHITE_ROOK, Pieces.ROOK],
      [WHITE_KING, Pieces.KING],
    ] as const;

    const option = options.find(([bitboard, piece]) =>
      Boolean(bitboard & offset)
    );

    if (option) {
      const [bitboard, piece] = option;
      if (WHITE_PIECES & bitboard) return -piece;
      if (BLACK_PIECES & bitboard) return piece;
    }

    return null;
  }
  return null;
}
```

<br />

#### 移动

```ts
// 删除棋子
function remove_piece(piece: Pieces, offset: number) {
  const target = 1n << BigInt(offset);

  relation_ship_of_piece(piece).forEach((item) => {
    // 这里看做为伪代码，这里 item 为 bigint，修改值无法传递过去
    item.assign(item.xor(target));
    // 等同于
    item = item ^ target;
  });
}

// 添加棋子
function add_piece(piece: Pieces, offset: number) {
  const target = 1n << BigInt(offset);
  this.relation_ship_of_piece(piece).forEach((item) => {
    // 这里看做为伪代码，这里 item 为 bigint，修改值无法传递过去
    item.assign(item.xor(target));
    // 等同于
    item = item ^ target;
  });
}

// 移动棋子
function move({ from, to }: { from: Square; to: Square }) {
  const white = !(player & Color.black);

  const [from_square, to_square] = [SQUARE_MAP[from], SQUARE_MAP[to]];
  // 获取需要移动的棋子
  const piece = piece_at(from_square);

  if (!piece) return null;

  // 获取移动方局面和相反阵营的局面
  const [from_board, to_board] = [
    white ? WHITE_PIECES : BLACK_PIECES,
    white ? BLACK_PIECES : WHITE_PIECES,
  ];

  // 获取到当前棋子的移动路径
  const attack_map = attack_map_static[Math.abs(piece) as Pieces][from_square];

  // 是否可以捕获到棋子
  const can_capture = attack_map & (1n << BigInt(to_square)) & to_board;

  if (can_capture) console.log("can capture");
  else console.log("move");

  // 可捕获状态下，消除对方棋子
  if (can_capture) {
    const to_piece = piece_at(to_square)!;
    // 在可吃子的情况下，删除敌方棋子
    remove_piece(to_piece, to_square);
  }

  // 添加我方棋子到目的地
  remove_piece(piece, from_square);
  add_piece(piece, to_square);
}
```

<br />

## 总结

完~
