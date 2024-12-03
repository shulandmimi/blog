const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

canvas.width = 500;
canvas.height = 300;

type Size = { width: number; height: number };
type Position = { x: number; y: number };

type Rect = Size & Position;

interface GridOptions {
    containerRect: Size;
    cellRect: Size;
}

class Grids {
    constructor(private options: GridOptions) {}

    positionByIndex(x: number, y: number): Position {
        return {
            x: x * this.options.cellRect.width,
            y: y * this.options.cellRect.height,
        };
    }

    centerByIndex(
        xIndex: number,
        yIndex: number,
        { width: w, height: h }: Size
    ): Position {
        const { width: cellWidth, height: cellHeight } = this.options.cellRect;
        const { x, y } = this.positionByIndex(xIndex, yIndex);
        return {
            x: x + cellWidth / 2 - w / 2,
            y: y + cellHeight / 2 - h / 2,
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 0.5;

        // 将宽度/高度为10的网格绘制到画布上
        for (
            let x = 0;
            x <= this.options.containerRect.width;
            x += this.options.cellRect.width
        ) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 300);
        }

        for (
            let y = 0;
            y <= this.options.containerRect.height;
            y += this.options.cellRect.height
        ) {
            ctx.moveTo(0, y);
            ctx.lineTo(500, y);
        }

        // 绘制出线条
        ctx.stroke();
    }
}

const cellRect: Size = { width: 50, height: 50 };

const grids = new Grids({
    containerRect: { width: canvas.width, height: canvas.height },
    cellRect,
});

grids.draw(ctx);

interface StyleProperties {
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

class StyleSetter {
    properties: StyleProperties = {};

    setSize(size: Size): this {
        this.properties.width = size.width;
        this.properties.height = size.height;
        return this;
    }

    setPosition(position: Position): this {
        this.properties.x = position.x;
        this.properties.y = position.y;
        return this;
    }

    setBackground(color: string): this {
        this.properties.backgroundColor = color;
        return this;
    }

    background(): string | undefined {
        return this.properties.backgroundColor;
    }

    position(): Position {
        return { x: this.properties.x ?? 0, y: this.properties.y ?? 0 };
    }

    borderWidth() {
        return this.properties.borderWidth ?? 0;
    }

    clientWidth() {
        const width = this.properties.width;

        return width ? width + this.borderWidth() * 2 : 0;
    }

    clientHeight() {
        const height = this.properties.height;

        return height ? height + this.borderWidth() * 2 : 0;
    }

    size(): Size {
        return {
            width: this.properties.width ?? 0,
            height: this.properties.height ?? 0,
        };
    }

    rect(): Rect {
        return { ...this.position(), ...this.size() };
    }

    styles(): StyleProperties {
        return this.properties;
    }
}

class GridCell {
    styles: StyleSetter = new StyleSetter();

    constructor(position: Position, private ctx: CanvasRenderingContext2D) {
        this.styles
            .setSize({ width: cellRect.width - 2, height: cellRect.height - 2 })
            .setPosition({ x: position.x + 1, y: position.y + 1 })
            .setBackground("blue");
    }

    draw() {
        const ctx = this.ctx;
        const { x, y, width, height } = this.styles.rect();
        ctx.fillStyle = this.styles.background() ?? "blue";
        ctx.fillRect(x, y, width, height);

        return this;
    }

    clear() {
        const rect = this.styles.rect();
        this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    }

    rerender() {
        this.clear();
        this.draw();
    }

    changePosition(position: Position) {
        this.clear();
        this.styles.setPosition(position);
        this.draw();
        return this;
    }
}

class MapCell extends GridCell {
    _block = false;

    setBlock(): this {
        this._block = true;
        return this;
    }
}

class IMap {
    areas: MapCell[][] = [];
    constructor(w: number, h: number) {
        this.areas = Array.from({ length: h }, (_, line) =>
            Array.from(
                { length: w },
                (_, col) =>
                    new MapCell(
                        { x: col * cellRect.width, y: line * cellRect.height },
                        ctx
                    )
            )
        );
    }
}

enum VectorDirection {
    Left,
    Right,
    Top,
    Bottom,
    LeftTop,
    LeftBottom,
    RightTop,
    RightBottom,
}

class VectorCell {
    direction!: VectorDirection;
    step: number = 0;
    mark: boolean = false;
}

class FlowFields {
    vector_area: VectorCell[][] = [];

    constructor(
        private map: IMap,
        public start: Position,
        public end: Position
    ) {
        this.vector_area = Array.from({ length: map.areas.length }, () =>
            Array.from({ length: map.areas[0].length }, () => new VectorCell())
        );
    }

    build_steps() {
        const queue: Position[] = [this.end];

        while (queue.length) {
            const item = queue.shift()!;
            const { x, y } = item;
            const vector = this.vector_area[y][x];
            const cell = this.map.areas[y][x];

            if (cell._block) {
                continue;
            }

            vector.mark = true;

            const neighbors = [
                [x - 1, y, VectorDirection.Left],
                [x + 1, y, VectorDirection.Right],
                [x, y - 1, VectorDirection.Top],
                [x, y + 1, VectorDirection.Bottom],
                [x - 1, y - 1, VectorDirection.LeftTop],
                [x - 1, y + 1, VectorDirection.LeftBottom],
                [x + 1, y - 1, VectorDirection.RightTop],
                [x + 1, y + 1, VectorDirection.RightBottom],
            ] as const;

            let min: [VectorCell, VectorDirection] | undefined = undefined;
            for (const neighborItem of neighbors) {
                const [nx, ny, direction] = neighborItem;
                if (
                    nx < 0 ||
                    ny < 0 ||
                    nx >= this.map.areas[0].length ||
                    ny >= this.map.areas.length
                ) {
                    continue;
                }

                const neighbor = this.map.areas[ny][nx];
                let neighbor_vector = this.vector_area[ny][nx];

                if (neighbor._block) {
                    continue;
                }

                if (neighbor_vector.mark) {
                    if (min === undefined) min = [neighbor_vector, direction];
                    else if (min[0].step > neighbor_vector.step) {
                        min = [neighbor_vector, direction];
                    }

                    continue;
                }

                queue.push({ x: nx, y: ny });
            }

            if (min) {
                vector.step = min[0].step + 1;
                vector.direction = min[1];
            } else {
                vector.step = 0;
            }
        }
    }

    getCell(position: Position) {
        return this.map.areas[position.y][position.x];
    }

    findFirstShortestPaths() {
        const paths: Position[] = [];
        let position = this.start;
        let vector = this.vector_area[position.y][position.x];

        while (true) {
            paths.push(position);
            if (position.x === this.end.x && position.y === this.end.y) {
                break;
            }
            const { x, y } = position;
            const { direction } = vector;
            const nextPosition = { x: x, y: y };

            switch (direction) {
                case VectorDirection.Left:
                    nextPosition.x -= 1;
                    break;
                case VectorDirection.Right:
                    nextPosition.x += 1;
                    break;
                case VectorDirection.Top:
                    nextPosition.y -= 1;
                    break;
                case VectorDirection.Bottom:
                    nextPosition.y += 1;
                    break;
                case VectorDirection.LeftTop:
                    nextPosition.x -= 1;
                    nextPosition.y -= 1;
                    break;
                case VectorDirection.LeftBottom:
                    nextPosition.x -= 1;
                    nextPosition.y += 1;
                    break;
                case VectorDirection.RightTop:
                    nextPosition.x += 1;
                    nextPosition.y -= 1;
                    break;
                case VectorDirection.RightBottom:
                    nextPosition.x += 1;
                    nextPosition.y += 1;
                    break;
            }

            position = nextPosition;
            vector = this.vector_area[position.y][position.x];
        }

        return paths;
    }
}

const map = new IMap(10, 6);
const flow_fields = new FlowFields(map, { x: 0, y: 0 }, { x: 8, y: 3 });

flow_fields.getCell({ x: 0, y: 0 }).draw();
flow_fields.getCell({ x: 8, y: 3 }).draw();

flow_fields.build_steps();

console.log(
    flow_fields.vector_area
        .map((line, lineIndex) =>
            line
                .map((col, colIndex) => {
                    if (
                        lineIndex === flow_fields.start.y &&
                        colIndex === flow_fields.start.x
                    ) {
                        return "X";
                    }

                    if (
                        lineIndex === flow_fields.end.y &&
                        colIndex === flow_fields.end.x
                    ) {
                        return "E";
                    }

                    switch (col.direction) {
                        case VectorDirection.Left:
                            return "←";
                        case VectorDirection.Right:
                            return "→";
                        case VectorDirection.Top:
                            return "↑";
                        case VectorDirection.Bottom:
                            return "↓";
                        case VectorDirection.LeftTop:
                            return "↖";
                        case VectorDirection.LeftBottom:
                            return "↙";
                        case VectorDirection.RightTop:
                            return "↗";
                        case VectorDirection.RightBottom:
                            return "↘";
                    }

                    return col.step;
                })
                .join("")
        )
        .join("\n")
);

const paths = flow_fields.findFirstShortestPaths();

const start = flow_fields.getCell(paths[0]);

let index = 1;
let timer = setInterval(() => {
    const path = paths[index];
    start.changePosition(grids.positionByIndex(path.x, path.y)).draw();
    index++;
    if (index >= paths.length) {
        clearInterval(timer);
    }
}, 500);
