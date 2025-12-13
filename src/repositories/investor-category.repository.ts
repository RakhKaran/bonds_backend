import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {InvestorCategory, InvestorCategoryRelations} from '../models';

export class InvestorCategoryRepository extends TimeStampRepositoryMixin<
  InvestorCategory,
  typeof InvestorCategory.prototype.id,
  Constructor<
    DefaultCrudRepository<
      InvestorCategory,
      typeof InvestorCategory.prototype.id,
      InvestorCategoryRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource,
  ) {
    super(InvestorCategory, dataSource);
  }
}

