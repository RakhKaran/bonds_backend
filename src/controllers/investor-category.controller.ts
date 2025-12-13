import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {authorize} from '../authorization';
import {InvestorCategory} from '../models';
import {InvestorCategoryRepository} from '../repositories';

export class InvestorCategoryController {
  constructor(
    @repository(InvestorCategoryRepository)
    public investorCategoryRepository: InvestorCategoryRepository,
  ) { }

  // @authenticate('jwt')
  // @authorize({roles: ['super_admin']})
  @post('/investor-categories')
  @response(200, {
    description: 'InvestorCategory model instance',
    content: {'application/json': {schema: getModelSchemaRef(InvestorCategory)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorCategory, {
            title: 'NewInvestorCategory',
            exclude: ['id'],
          }),
        },
      },
    })
    investorCategory: Omit<InvestorCategory, 'id'>,
  ): Promise<InvestorCategory> {
    return this.investorCategoryRepository.create(investorCategory);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @get('/investor-categories/count')
  @response(200, {
    description: 'InvestorCategory model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(InvestorCategory) where?: Where<InvestorCategory>,
  ): Promise<Count> {
    return this.investorCategoryRepository.count(where);
  }

  @get('/investor-categories')
  @response(200, {
    description: 'Array of InvestorCategory model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InvestorCategory, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(InvestorCategory) filter?: Filter<InvestorCategory>,
  ): Promise<InvestorCategory[]> {
    return this.investorCategoryRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/investor-categories')
  @response(200, {
    description: 'InvestorCategory PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorCategory, {partial: true}),
        },
      },
    })
    investorCategory: InvestorCategory,
    @param.where(InvestorCategory) where?: Where<InvestorCategory>,
  ): Promise<Count> {
    return this.investorCategoryRepository.updateAll(investorCategory, where);
  }

  @get('/investor-categories/{id}')
  @response(200, {
    description: 'InvestorCategory model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InvestorCategory, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(InvestorCategory, {exclude: 'where'}) filter?: FilterExcludingWhere<InvestorCategory>
  ): Promise<InvestorCategory> {
    return this.investorCategoryRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/investor-categories/{id}')
  @response(204, {
    description: 'InvestorCategory PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InvestorCategory, {partial: true}),
        },
      },
    })
    investorCategory: InvestorCategory,
  ): Promise<void> {
    await this.investorCategoryRepository.updateById(id, investorCategory);
  }

  // @authenticate('jwt')
  // @authorize({roles: ['super_admin']})
  // @put('/investor-categories/{id}')
  // @response(204, {
  //   description: 'InvestorCategory PUT success',
  // })
  // async replaceById(
  //   @param.path.string('id') id: string,
  //   @requestBody() investorCategory: InvestorCategory,
  // ): Promise<void> {
  //   await this.investorCategoryRepository.replaceById(id, investorCategory);
  // }

  // @authenticate('jwt')
  // @authorize({roles: ['super_admin']})
  // @del('/investor-categories/{id}')
  // @response(204, {
  //   description: 'InvestorCategory DELETE success',
  // })
  // async deleteById(@param.path.string('id') id: string): Promise<void> {
  //   await this.investorCategoryRepository.deleteById(id);
  // }
}
