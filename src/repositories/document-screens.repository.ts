import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DocumentScreens, DocumentScreensRelations} from '../models';

export class DocumentScreensRepository extends TimeStampRepositoryMixin<
  DocumentScreens,
  typeof DocumentScreens.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DocumentScreens,
      typeof DocumentScreens.prototype.id,
      DocumentScreensRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource,
  ) {
    super(DocumentScreens, dataSource);
  }
}
