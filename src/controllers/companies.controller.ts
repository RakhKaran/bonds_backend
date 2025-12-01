import {authenticate} from '@loopback/authentication';
import {Filter, repository} from '@loopback/repository';
import {get, param} from '@loopback/rest';
import {authorize} from '../authorization';
import {CompanyProfiles} from '../models';
import {CompanyProfilesRepository} from '../repositories';

export class CompaniesController {
  constructor(
    @repository(CompanyProfilesRepository)
    private companyProfilesRepository: CompanyProfilesRepository
  ) { }

  // Get company profiles...
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/company-profiles')
  async getCompanyProfiles(
    @param.filter(CompanyProfiles) filter?: Filter<CompanyProfiles>,
    @param.query.number('limit') limit?: number,
    @param.query.number('skip') skip?: number
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      count: number;
      profiles: CompanyProfiles[];
    }
  }> {
    const company = await this.companyProfilesRepository.find({
      ...filter,
      limit: limit ?? 10,
      skip: skip ?? 0,
      include: [
        {relation: 'users', scope: {fields: {id: true, phone: true, email: true}}},
        {relation: 'kycApplications', scope: {fields: {id: true, usersId: true, status: true, mode: true}}},
        {relation: 'companyEntityType'},
        {relation: 'companySectorType'},
        {relation: 'companyLogoData', scope: {fields: {id: true, fileOriginalName: true, fileUrl: true}}},
      ]
    });

    const totalCount = await this.companyProfilesRepository.count(filter?.where);

    return {
      success: true,
      message: 'Company Profiles',
      data: {
        count: totalCount.count,
        profiles: company
      }
    }
  }

  // Get company profiles by id...
  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/company-profiles/{id}')
  async getCompanyProfile(
    @param.path.string('id') id: string,
    @param.filter(CompanyProfiles) filter?: Filter<CompanyProfiles>,
  ): Promise<{
    success: boolean;
    message: string;
    data: CompanyProfiles;
  }> {
    const company = await this.companyProfilesRepository.findById(id, {
      ...filter,
      include: [
        {relation: 'users', scope: {fields: {id: true, phone: true, email: true}}},
        {relation: 'kycApplications'},
        {relation: 'companyPanCards', scope: {include: [{relation: 'panCardDocument'}]}},
        {relation: 'companyEntityType'},
        {relation: 'companySectorType'},
        {relation: 'companyLogoData', scope: {fields: {id: true, fileOriginalName: true, fileUrl: true}}},
      ]
    });

    return {
      success: true,
      message: 'Company Profiles',
      data: company
    }
  }
}
