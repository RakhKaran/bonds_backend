import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory, HasManyRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {Users, UsersRelations, Roles, UserRoles, KycApplications} from '../models';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {UserRolesRepository} from './user-roles.repository';
import {RolesRepository} from './roles.repository';
import {KycApplicationsRepository} from './kyc-applications.repository';

export class UsersRepository extends TimeStampRepositoryMixin<
  Users,
  typeof Users.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Users,
      typeof Users.prototype.id,
      UsersRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly roles: HasManyThroughRepositoryFactory<Roles, typeof Roles.prototype.id,
          UserRoles,
          typeof Users.prototype.id
        >;

  public readonly kycApplications: HasManyRepositoryFactory<KycApplications, typeof Users.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('UserRolesRepository') protected userRolesRepositoryGetter: Getter<UserRolesRepository>, @repository.getter('RolesRepository') protected rolesRepositoryGetter: Getter<RolesRepository>, @repository.getter('KycApplicationsRepository') protected kycApplicationsRepositoryGetter: Getter<KycApplicationsRepository>,
  ) {
    super(Users, dataSource);
    this.kycApplications = this.createHasManyRepositoryFactoryFor('kycApplications', kycApplicationsRepositoryGetter,);
    this.registerInclusionResolver('kycApplications', this.kycApplications.inclusionResolver);
    this.roles = this.createHasManyThroughRepositoryFactoryFor('roles', rolesRepositoryGetter, userRolesRepositoryGetter,);
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);
  }
}
