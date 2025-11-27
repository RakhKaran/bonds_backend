import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {CreditRatings, CreditRatingsRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class CreditRatingsRepository extends TimeStampRepositoryMixin<
  CreditRatings,
  typeof CreditRatings.prototype.id,
  Constructor<
    DefaultCrudRepository<
      CreditRatings,
      typeof CreditRatings.prototype.id,
      CreditRatingsRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource,
  ) {
    super(CreditRatings, dataSource);
  }
}
