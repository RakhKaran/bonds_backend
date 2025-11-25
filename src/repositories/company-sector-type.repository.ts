import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {CompanySectorType, CompanySectorTypeRelations, CompanyProfiles} from '../models';
import {CompanyProfilesRepository} from './company-profiles.repository';

export class CompanySectorTypeRepository extends TimeStampRepositoryMixin<
  CompanySectorType,
  typeof CompanySectorType.prototype.id,
  Constructor<
    DefaultCrudRepository<
      CompanySectorType,
      typeof CompanySectorType.prototype.id,
      CompanySectorTypeRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly companyProfiles: HasManyRepositoryFactory<CompanyProfiles, typeof CompanySectorType.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('CompanyProfilesRepository') protected companyProfilesRepositoryGetter: Getter<CompanyProfilesRepository>,
  ) {
    super(CompanySectorType, dataSource);
    this.companyProfiles = this.createHasManyRepositoryFactoryFor('companyProfiles', companyProfilesRepositoryGetter,);
    this.registerInclusionResolver('companyProfiles', this.companyProfiles.inclusionResolver);
  }
}
