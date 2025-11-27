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
import {CreditRatingAgencies} from '../models';
import {CreditRatingAgenciesRepository} from '../repositories';

export class CreditRatingAgenciesController {
  constructor(
    @repository(CreditRatingAgenciesRepository)
    public creditRatingAgenciesRepository: CreditRatingAgenciesRepository,
  ) { }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @post('/credit-rating-agencies')
  @response(200, {
    description: 'CreditRatingAgencies model instance',
    content: {'application/json': {schema: getModelSchemaRef(CreditRatingAgencies)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatingAgencies, {
            title: 'NewCreditRatingAgencies',
            exclude: ['id'],
          }),
        },
      },
    })
    creditRatingAgencies: Omit<CreditRatingAgencies, 'id'>,
  ): Promise<CreditRatingAgencies> {
    return this.creditRatingAgenciesRepository.create(creditRatingAgencies);
  }

  @get('/credit-rating-agencies/count')
  @response(200, {
    description: 'CreditRatingAgencies model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CreditRatingAgencies) where?: Where<CreditRatingAgencies>,
  ): Promise<Count> {
    return this.creditRatingAgenciesRepository.count(where);
  }

  @get('/credit-rating-agencies')
  @response(200, {
    description: 'Array of CreditRatingAgencies model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CreditRatingAgencies, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CreditRatingAgencies) filter?: Filter<CreditRatingAgencies>,
  ): Promise<CreditRatingAgencies[]> {
    return this.creditRatingAgenciesRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/credit-rating-agencies')
  @response(200, {
    description: 'CreditRatingAgencies PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatingAgencies, {partial: true}),
        },
      },
    })
    creditRatingAgencies: CreditRatingAgencies,
    @param.where(CreditRatingAgencies) where?: Where<CreditRatingAgencies>,
  ): Promise<Count> {
    return this.creditRatingAgenciesRepository.updateAll(creditRatingAgencies, where);
  }

  @get('/credit-rating-agencies/{id}')
  @response(200, {
    description: 'CreditRatingAgencies model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CreditRatingAgencies, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(CreditRatingAgencies, {exclude: 'where'}) filter?: FilterExcludingWhere<CreditRatingAgencies>
  ): Promise<CreditRatingAgencies> {
    return this.creditRatingAgenciesRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/credit-rating-agencies/{id}')
  @response(204, {
    description: 'CreditRatingAgencies PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatingAgencies, {partial: true}),
        },
      },
    })
    creditRatingAgencies: CreditRatingAgencies,
  ): Promise<void> {
    await this.creditRatingAgenciesRepository.updateById(id, creditRatingAgencies);
  }

  // @put('/credit-rating-agencies/{id}')
  // @response(204, {
  //   description: 'CreditRatingAgencies PUT success',
  // })
  // async replaceById(
  //   @param.path.string('id') id: string,
  //   @requestBody() creditRatingAgencies: CreditRatingAgencies,
  // ): Promise<void> {
  //   await this.creditRatingAgenciesRepository.replaceById(id, creditRatingAgencies);
  // }

  // @del('/credit-rating-agencies/{id}')
  // @response(204, {
  //   description: 'CreditRatingAgencies DELETE success',
  // })
  // async deleteById(@param.path.string('id') id: string): Promise<void> {
  //   await this.creditRatingAgenciesRepository.deleteById(id);
  // }
}
