import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {EstimationBorrowingDetails, EstimationBorrowingDetailsRelations, BondEstimations} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {BondEstimationsRepository} from './bond-estimations.repository';

export class EstimationBorrowingDetailsRepository extends TimeStampRepositoryMixin<
  EstimationBorrowingDetails,
  typeof EstimationBorrowingDetails.prototype.id,
  Constructor<
    DefaultCrudRepository<
      EstimationBorrowingDetails,
      typeof EstimationBorrowingDetails.prototype.id,
      EstimationBorrowingDetailsRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly bondEstimations: BelongsToAccessor<BondEstimations, typeof EstimationBorrowingDetails.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('BondEstimationsRepository') protected bondEstimationsRepositoryGetter: Getter<BondEstimationsRepository>,
  ) {
    super(EstimationBorrowingDetails, dataSource);
    this.bondEstimations = this.createBelongsToAccessorFor('bondEstimations', bondEstimationsRepositoryGetter,);
    this.registerInclusionResolver('bondEstimations', this.bondEstimations.inclusionResolver);
  }
}
