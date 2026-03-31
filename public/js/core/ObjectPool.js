class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.pool = [];
    this.inUse = new Set();
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.factory();
    }
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    this.inUse.forEach(obj => {
      this.pool.push(obj);
    });
    this.inUse.clear();
  }

  get size() {
    return this.pool.length + this.inUse.size;
  }

  get available() {
    return this.pool.length;
  }
}

export default ObjectPool;