import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory, HasOneRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {BondEstimations, BondEstimationsRelations, CompanyProfiles, EstimationCreditRatings, EstimationBorrowingDetails, EstimationPriliminaryBondRequirements} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {CompanyProfilesRepository} from './company-profiles.repository';
import {EstimationCreditRatingsRepository} from './estimation-credit-ratings.repository';
import {EstimationBorrowingDetailsRepository} from './estimation-borrowing-details.repository';
import {EstimationPriliminaryBondRequirementsRepository} from './estimation-priliminary-bond-requirements.repository';

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

  public readonly estimationBorrowingDetails: HasManyRepositoryFactory<EstimationBorrowingDetails, typeof BondEstimations.prototype.id>;

  public readonly estimationPriliminaryBondRequirements: HasOneRepositoryFactory<EstimationPriliminaryBondRequirements, typeof BondEstimations.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('CompanyProfilesRepository') protected companyProfilesRepositoryGetter: Getter<CompanyProfilesRepository>, @repository.getter('EstimationCreditRatingsRepository') protected estimationCreditRatingsRepositoryGetter: Getter<EstimationCreditRatingsRepository>, @repository.getter('EstimationBorrowingDetailsRepository') protected estimationBorrowingDetailsRepositoryGetter: Getter<EstimationBorrowingDetailsRepository>, @repository.getter('EstimationPriliminaryBondRequirementsRepository') protected estimationPriliminaryBondRequirementsRepositoryGetter: Getter<EstimationPriliminaryBondRequirementsRepository>,
  ) {
    super(BondEstimations, dataSource);
    this.estimationPriliminaryBondRequirements = this.createHasOneRepositoryFactoryFor('estimationPriliminaryBondRequirements', estimationPriliminaryBondRequirementsRepositoryGetter);
    this.registerInclusionResolver('estimationPriliminaryBondRequirements', this.estimationPriliminaryBondRequirements.inclusionResolver);
    this.estimationBorrowingDetails = this.createHasManyRepositoryFactoryFor('estimationBorrowingDetails', estimationBorrowingDetailsRepositoryGetter,);
    this.registerInclusionResolver('estimationBorrowingDetails', this.estimationBorrowingDetails.inclusionResolver);
    this.estimationCreditRatings = this.createHasManyRepositoryFactoryFor('estimationCreditRatings', estimationCreditRatingsRepositoryGetter,);
    this.registerInclusionResolver('estimationCreditRatings', this.estimationCreditRatings.inclusionResolver);
    this.companyProfiles = this.createBelongsToAccessorFor('companyProfiles', companyProfilesRepositoryGetter,);
    this.registerInclusionResolver('companyProfiles', this.companyProfiles.inclusionResolver);
  }
}
