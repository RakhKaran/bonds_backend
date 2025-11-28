import {Constructor, inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasOneRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {BondsDataSource} from '../datasources';
import {TimeStampRepositoryMixin} from '../mixins/timestamp-repository-mixin';
import {TrusteeProfiles, TrusteeProfilesRelations, TrusteePanCards, KycApplications, Users, Media} from '../models';
import {TrusteePanCardsRepository} from './trustee-pan-cards.repository';
import {KycApplicationsRepository} from './kyc-applications.repository';
import {UsersRepository} from './users.repository';
import {MediaRepository} from './media.repository';

export class TrusteeProfilesRepository extends TimeStampRepositoryMixin<
  TrusteeProfiles,
  typeof TrusteeProfiles.prototype.id,
  Constructor<
    DefaultCrudRepository<
      TrusteeProfiles,
      typeof TrusteeProfiles.prototype.id,
      TrusteeProfilesRelations
    >
  >
>(DefaultCrudRepository) {

  public readonly trusteePanCards: HasOneRepositoryFactory<TrusteePanCards, typeof TrusteeProfiles.prototype.id>;

  public readonly kycApplications: BelongsToAccessor<KycApplications, typeof TrusteeProfiles.prototype.id>;

  public readonly users: BelongsToAccessor<Users, typeof TrusteeProfiles.prototype.id>;

  public readonly trusteeLogo: BelongsToAccessor<Media, typeof TrusteeProfiles.prototype.id>;

  constructor(
    @inject('datasources.bonds') dataSource: BondsDataSource, @repository.getter('TrusteePanCardsRepository') protected trusteePanCardsRepositoryGetter: Getter<TrusteePanCardsRepository>, @repository.getter('KycApplicationsRepository') protected kycApplicationsRepositoryGetter: Getter<KycApplicationsRepository>, @repository.getter('UsersRepository') protected usersRepositoryGetter: Getter<UsersRepository>, @repository.getter('MediaRepository') protected mediaRepositoryGetter: Getter<MediaRepository>,
  ) {
    super(TrusteeProfiles, dataSource);
    this.trusteeLogo = this.createBelongsToAccessorFor('trusteeLogo', mediaRepositoryGetter,);
    this.registerInclusionResolver('trusteeLogo', this.trusteeLogo.inclusionResolver);
    this.users = this.createBelongsToAccessorFor('users', usersRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
    this.kycApplications = this.createBelongsToAccessorFor('kycApplications', kycApplicationsRepositoryGetter,);
    this.registerInclusionResolver('kycApplications', this.kycApplications.inclusionResolver);
    this.trusteePanCards = this.createHasOneRepositoryFactoryFor('trusteePanCards', trusteePanCardsRepositoryGetter);
    this.registerInclusionResolver('trusteePanCards', this.trusteePanCards.inclusionResolver);
  }
}
