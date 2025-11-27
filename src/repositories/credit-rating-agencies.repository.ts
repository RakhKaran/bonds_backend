import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {CreditRatingAgencies, CreditRatingAgenciesRelations, Media} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {MediaRepository} from './media.repository';

export class CreditRatingAgenciesRepository extends TimeStampRepositoryMixin<
  CreditRatingAgencies,
  typeof CreditRatingAgencies.prototype.id,
  Constructor<
    DefaultCrudRepository<
      CreditRatingAgencies,
      typeof CreditRatingAgencies.prototype.id,
      CreditRatingAgenciesRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly logo: BelongsToAccessor<Media, typeof CreditRatingAgencies.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('MediaRepository') protected mediaRepositoryGetter: Getter<MediaRepository>,
  ) {
    super(CreditRatingAgencies, dataSource);
    this.logo = this.createBelongsToAccessorFor('logo', mediaRepositoryGetter,);
    this.registerInclusionResolver('logo', this.logo.inclusionResolver);
  }
}
