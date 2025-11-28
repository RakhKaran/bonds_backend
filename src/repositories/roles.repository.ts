import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {Roles, RolesRelations, Permissions, RolePermissions, Users, UserRoles, DocumentTypes, DocumentRoles} from '../models';
import {RolePermissionsRepository} from './role-permissions.repository';
import {PermissionsRepository} from './permissions.repository';
import {UserRolesRepository} from './user-roles.repository';
import {UsersRepository} from './users.repository';
import {DocumentRolesRepository} from './document-roles.repository';
import {DocumentTypesRepository} from './document-types.repository';

export class RolesRepository extends TimeStampRepositoryMixin<
  Roles,
  typeof Roles.prototype.id,
  Constructor<
    DefaultCrudRepository<
      Roles,
      typeof Roles.prototype.id,
      RolesRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly permissions: HasManyThroughRepositoryFactory<Permissions, typeof Permissions.prototype.id,
          RolePermissions,
          typeof Roles.prototype.id
        >;

  public readonly users: HasManyThroughRepositoryFactory<Users, typeof Users.prototype.id,
          UserRoles,
          typeof Roles.prototype.id
        >;

  public readonly documentTypes: HasManyThroughRepositoryFactory<DocumentTypes, typeof DocumentTypes.prototype.id,
          DocumentRoles,
          typeof Roles.prototype.id
        >;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('RolePermissionsRepository') protected rolePermissionsRepositoryGetter: Getter<RolePermissionsRepository>, @repository.getter('PermissionsRepository') protected permissionsRepositoryGetter: Getter<PermissionsRepository>, @repository.getter('UserRolesRepository') protected userRolesRepositoryGetter: Getter<UserRolesRepository>, @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>, @repository.getter('DocumentRolesRepository') protected documentRolesRepositoryGetter: Getter<DocumentRolesRepository>, @repository.getter('DocumentTypesRepository') protected documentTypesRepositoryGetter: Getter<DocumentTypesRepository>,
  ) {
    super(Roles, dataSource);
    this.documentTypes = this.createHasManyThroughRepositoryFactoryFor('documentTypes', documentTypesRepositoryGetter, documentRolesRepositoryGetter,);
    this.registerInclusionResolver('documentTypes', this.documentTypes.inclusionResolver);
    this.users = this.createHasManyThroughRepositoryFactoryFor('users', usersRepositoryGetter, userRolesRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
    this.permissions = this.createHasManyThroughRepositoryFactoryFor('permissions', permissionsRepositoryGetter, rolePermissionsRepositoryGetter,);
    this.registerInclusionResolver('permissions', this.permissions.inclusionResolver);
  }
}
