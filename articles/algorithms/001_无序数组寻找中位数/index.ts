/*

1000w长度的无序数组，找出中位数，时间复杂度要求<NlogN？

*/

class MinHeap {
    heap: number[] = [];
    constructor() {
        this.heap = [0];
    }

    up(index: number) {
        const parent = (index / 2) >> 0;
        if (index < 1 || parent < 1) return;

        if (this.heap[parent] === undefined || this.heap[parent] > this.heap[index]) {
            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
            this.up(parent);
        }
    }

    down(index: number): number {
        const left = index * 2;
        const right = left + 1;
        if (left >= this.heap.length) return index;

        let i = left;
        if (right < this.heap.length && (this.heap[right] < this.heap[left] || this.heap[left] === undefined)) {
            i = right;
        }

        [this.heap[index], this.heap[i]] = [this.heap[i], this.heap[index]];

        return this.down(i);
    }

    insert(v: number) {
        if (this.isEmpty()) {
            this.heap[1] = v;
            return;
        }

        this.heap[this.heap.length] = v;
        this.up(this.heap.length - 1);
    }

    pop() {
        const index = this.down(1);
        const v = this.heap[index];
        delete this.heap[index];
        return v;
    }

    top() {
        return this.heap[1];
    }

    isEmpty() {
        return this.heap.length === 1;
    }
}

function findMiddleNumber(arr: number[]) {
    const heap = new MinHeap();

    const heapSize = ((arr.length / 2) >> 0) + 1;
    for (let i = 0; i < heapSize; i++) {
        heap.insert(arr[i]);
    }

    for (let i = heapSize; i < arr.length; i++) {
        if (arr[i] > heap.top()) {
            heap.pop();
            heap.insert(arr[i]);
        }
    }

    if (arr.length % 2 === 1) {
        return heap.top();
    } else {
        const top = heap.top();
        heap.pop();
        return (top + heap.top()) / 2.0;
    }
}

// 2 3 4 5 6
console.log(findMiddleNumber([5, 4, 3, 2, 6]));
console.log(findMiddleNumber([10, 50, 20, 40, 90, 100]));
