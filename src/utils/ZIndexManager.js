export default class ZIndexManager {
    static currentMaxZ = 1000;

    static getNextIndex() {
        this.currentMaxZ++;
        return this.currentMaxZ;
    }

    static setMax(value) {
        if (value > this.currentMaxZ) {
            this.currentMaxZ = value;
        }
    }
}
