class IReadableRepository {
  findById(id) {
    throw new Error('Not implemented');
  }

  findAll() {
    throw new Error('Not implemented');
  }

  findByPlayerId(playerId) {
    throw new Error('Not implemented');
  }
}

module.exports = IReadableRepository;