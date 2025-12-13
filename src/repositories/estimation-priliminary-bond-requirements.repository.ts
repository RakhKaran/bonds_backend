import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {EstimationPriliminaryBondRequirements, EstimationPriliminaryBondRequirementsRelations, BondEstimations, InvestorCategory} from '../models';
import {BondEstimationsRepository} from './bond-estimations.repository';
import {InvestorCategoryRepository} from './investor-category.repository';

export class EstimationPriliminaryBondRequirementsRepository extends TimeStampRepositoryMixin<
  EstimationPriliminaryBondRequirements,
  typeof EstimationPriliminaryBondRequirements.prototype.id,
  Constructor<
    DefaultCrudRepository<
      EstimationPriliminaryBondRequirements,
      typeof EstimationPriliminaryBondRequirements.prototype.id,
      EstimationPriliminaryBondRequirementsRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly bondEstimations: BelongsToAccessor<BondEstimations, typeof EstimationPriliminaryBondRequirements.prototype.id>;

  public readonly investorCategory: BelongsToAccessor<InvestorCategory, typeof EstimationPriliminaryBondRequirements.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('BondEstimationsRepository') protected bondEstimationsRepositoryGetter: Getter<BondEstimationsRepository>, @repository.getter('InvestorCategoryRepository') protected investorCategoryRepositoryGetter: Getter<InvestorCategoryRepository>,
  ) {
    super(EstimationPriliminaryBondRequirements, dataSource);
    this.investorCategory = this.createBelongsToAccessorFor('investorCategory', investorCategoryRepositoryGetter,);
    this.registerInclusionResolver('investorCategory', this.investorCategory.inclusionResolver);
    this.bondEstimations = this.createBelongsToAccessorFor('bondEstimations', bondEstimationsRepositoryGetter,);
    this.registerInclusionResolver('bondEstimations', this.bondEstimations.inclusionResolver);
  }
}
