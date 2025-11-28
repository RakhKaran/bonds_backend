import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {DocumentPlaceholders, DocumentPlaceholdersRelations, DocumentTypes} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {DocumentTypesRepository} from './document-types.repository';

export class DocumentPlaceholdersRepository extends TimeStampRepositoryMixin<
  DocumentPlaceholders,
  typeof DocumentPlaceholders.prototype.id,
  Constructor<
    DefaultCrudRepository<
      DocumentPlaceholders,
      typeof DocumentPlaceholders.prototype.id,
      DocumentPlaceholdersRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly documentTypes: BelongsToAccessor<DocumentTypes, typeof DocumentPlaceholders.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('DocumentTypesRepository') protected documentTypesRepositoryGetter: Getter<DocumentTypesRepository>,
  ) {
    super(DocumentPlaceholders, dataSource);
    this.documentTypes = this.createBelongsToAccessorFor('documentTypes', documentTypesRepositoryGetter,);
    this.registerInclusionResolver('documentTypes', this.documentTypes.inclusionResolver);
  }
}
