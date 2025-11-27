import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {BondEstimations, BondEstimationsRelations, CompanyProfiles, EstimationCreditRatings} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {CompanyProfilesRepository} from './company-profiles.repository';
import {EstimationCreditRatingsRepository} from './estimation-credit-ratings.repository';

export class BondEstimationsRepository extends TimeStampRepositoryMixin<
  BondEstimations,
  typeof BondEstimations.prototype.id,
  Constructor<
    DefaultCrudRepository<
      BondEstimations,
      typeof BondEstimations.prototype.id,
      BondEstimationsRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly companyProfiles: BelongsToAccessor<CompanyProfiles, typeof BondEstimations.prototype.id>;

  public readonly estimationCreditRatings: HasManyRepositoryFactory<EstimationCreditRatings, typeof BondEstimations.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('CompanyProfilesRepository') protected companyProfilesRepositoryGetter: Getter<CompanyProfilesRepository>, @repository.getter('EstimationCreditRatingsRepository') protected estimationCreditRatingsRepositoryGetter: Getter<EstimationCreditRatingsRepository>,
  ) {
    super(BondEstimations, dataSource);
    this.estimationCreditRatings = this.createHasManyRepositoryFactoryFor('estimationCreditRatings', estimationCreditRatingsRepositoryGetter,);
    this.registerInclusionResolver('estimationCreditRatings', this.estimationCreditRatings.inclusionResolver);
    this.companyProfiles = this.createBelongsToAccessorFor('companyProfiles', companyProfilesRepositoryGetter,);
    this.registerInclusionResolver('companyProfiles', this.companyProfiles.inclusionResolver);
  }
}
