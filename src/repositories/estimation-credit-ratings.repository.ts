import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {EstimationCreditRatings, EstimationCreditRatingsRelations, Media, CreditRatingAgencies, CreditRatings, BondEstimations} from '../models';
import {MediaRepository} from './media.repository';
import {CreditRatingAgenciesRepository} from './credit-rating-agencies.repository';
import {CreditRatingsRepository} from './credit-ratings.repository';
import {BondEstimationsRepository} from './bond-estimations.repository';

export class EstimationCreditRatingsRepository extends TimeStampRepositoryMixin<
  EstimationCreditRatings,
  typeof EstimationCreditRatings.prototype.id,
  Constructor<
    DefaultCrudRepository<
      EstimationCreditRatings,
      typeof EstimationCreditRatings.prototype.id,
      EstimationCreditRatingsRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly ratingLetter: BelongsToAccessor<Media, typeof EstimationCreditRatings.prototype.id>;

  public readonly creditRatingAgencies: BelongsToAccessor<CreditRatingAgencies, typeof EstimationCreditRatings.prototype.id>;

  public readonly creditRatings: BelongsToAccessor<CreditRatings, typeof EstimationCreditRatings.prototype.id>;

  public readonly bondEstimations: BelongsToAccessor<BondEstimations, typeof EstimationCreditRatings.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('MediaRepository') protected mediaRepositoryGetter: Getter<MediaRepository>, @repository.getter('CreditRatingAgenciesRepository') protected creditRatingAgenciesRepositoryGetter: Getter<CreditRatingAgenciesRepository>, @repository.getter('CreditRatingsRepository') protected creditRatingsRepositoryGetter: Getter<CreditRatingsRepository>, @repository.getter('BondEstimationsRepository') protected bondEstimationsRepositoryGetter: Getter<BondEstimationsRepository>,
  ) {
    super(EstimationCreditRatings, dataSource);
    this.bondEstimations = this.createBelongsToAccessorFor('bondEstimations', bondEstimationsRepositoryGetter,);
    this.registerInclusionResolver('bondEstimations', this.bondEstimations.inclusionResolver);
    this.creditRatings = this.createBelongsToAccessorFor('creditRatings', creditRatingsRepositoryGetter,);
    this.registerInclusionResolver('creditRatings', this.creditRatings.inclusionResolver);
    this.creditRatingAgencies = this.createBelongsToAccessorFor('creditRatingAgencies', creditRatingAgenciesRepositoryGetter,);
    this.registerInclusionResolver('creditRatingAgencies', this.creditRatingAgencies.inclusionResolver);
    this.ratingLetter = this.createBelongsToAccessorFor('ratingLetter', mediaRepositoryGetter,);
    this.registerInclusionResolver('ratingLetter', this.ratingLetter.inclusionResolver);
  }
}
