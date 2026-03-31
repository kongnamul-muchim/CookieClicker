class IWritableRepository {
  save(entity) {
    throw new Error('Not implemented');
  }

  delete(id) {
    throw new Error('Not implemented');
  }
}

module.exports = IWritableRepository;