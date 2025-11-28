import {Constructor, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {DocumentRoles, DocumentRolesRelations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';

export class DocumentRolesRepository extends TimeStampRepositoryMixin<
  DocumentRoles,
  typeof DocumentRoles.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DocumentRoles,
      typeof DocumentRoles.prototype.id,
      DocumentRolesRelations
    >
  >
>(DefaultCrudRepository) {
  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource,
  ) {
    super(DocumentRoles, dataSource);
  }
}
