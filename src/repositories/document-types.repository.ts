import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {DocumentTypes, DocumentTypesRelations, DocumentPlaceholders, Roles, DocumentRoles} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DocumentPlaceholdersRepository} from './document-placeholders.repository';
import {DocumentRolesRepository} from './document-roles.repository';
import {RolesRepository} from './roles.repository';

export class DocumentTypesRepository extends TimeStampRepositoryMixin<
  DocumentTypes,
  typeof DocumentTypes.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DocumentTypes,
      typeof DocumentTypes.prototype.id,
      DocumentTypesRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly documentPlaceholders: HasManyRepositoryFactory<DocumentPlaceholders, typeof DocumentTypes.prototype.id>;

  public readonly roles: HasManyThroughRepositoryFactory<Roles, typeof Roles.prototype.id,
          DocumentRoles,
          typeof DocumentTypes.prototype.id
        >;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('DocumentPlaceholdersRepository') protected documentPlaceholdersRepositoryGetter: Getter<DocumentPlaceholdersRepository>, @repository.getter('DocumentRolesRepository') protected documentRolesRepositoryGetter: Getter<DocumentRolesRepository>, @repository.getter('RolesRepository') protected rolesRepositoryGetter: Getter<RolesRepository>,
  ) {
    super(DocumentTypes, dataSource);
    this.roles = this.createHasManyThroughRepositoryFactoryFor('roles', rolesRepositoryGetter, documentRolesRepositoryGetter,);
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);
    this.documentPlaceholders = this.createHasManyRepositoryFactoryFor('documentPlaceholders', documentPlaceholdersRepositoryGetter,);
    this.registerInclusionResolver('documentPlaceholders', this.documentPlaceholders.inclusionResolver);
  }
}
