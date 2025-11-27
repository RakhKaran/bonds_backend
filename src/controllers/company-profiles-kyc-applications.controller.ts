import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  CompanyProfiles,
  KycApplications,
} from '../models';
import {CompanyProfilesRepository} from '../repositories';

export class CompanyProfilesKycApplicationsController {
  constructor(
    @repository(CompanyProfilesRepository)
    public companyProfilesRepository: CompanyProfilesRepository,
  ) { }

  @get('/company-profiles/{id}/kyc-applications', {
    responses: {
      '200': {
        description: 'KycApplications belonging to CompanyProfiles',
        content: {
          'application/json': {
            schema: getModelSchemaRef(KycApplications),
          },
        },
      },
    },
  })
  async getKycApplications(
    @param.path.string('id') id: typeof CompanyProfiles.prototype.id,
  ): Promise<KycApplications> {
    return this.companyProfilesRepository.kycApplications(id);
  }
}
