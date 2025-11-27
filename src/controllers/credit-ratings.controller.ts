import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  requestBody,
  response,
} from '@loopback/rest';
import {CreditRatings} from '../models';
import {CreditRatingsRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {authorize} from '../authorization';

export class CreditRatingsController {
  constructor(
    @repository(CreditRatingsRepository)
    public creditRatingsRepository: CreditRatingsRepository,
  ) { }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @post('/credit-ratings')
  @response(200, {
    description: 'CreditRatings model instance',
    content: {'application/json': {schema: getModelSchemaRef(CreditRatings)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatings, {
            title: 'NewCreditRatings',
            exclude: ['id'],
          }),
        },
      },
    })
    creditRatings: Omit<CreditRatings, 'id'>,
  ): Promise<CreditRatings> {
    return this.creditRatingsRepository.create(creditRatings);
  }

  @get('/credit-ratings/count')
  @response(200, {
    description: 'CreditRatings model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CreditRatings) where?: Where<CreditRatings>,
  ): Promise<Count> {
    return this.creditRatingsRepository.count(where);
  }

  @get('/credit-ratings')
  @response(200, {
    description: 'Array of CreditRatings model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CreditRatings, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CreditRatings) filter?: Filter<CreditRatings>,
  ): Promise<CreditRatings[]> {
    return this.creditRatingsRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/credit-ratings')
  @response(200, {
    description: 'CreditRatings PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatings, {partial: true}),
        },
      },
    })
    creditRatings: CreditRatings,
    @param.where(CreditRatings) where?: Where<CreditRatings>,
  ): Promise<Count> {
    return this.creditRatingsRepository.updateAll(creditRatings, where);
  }

  @get('/credit-ratings/{id}')
  @response(200, {
    description: 'CreditRatings model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CreditRatings, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(CreditRatings, {exclude: 'where'}) filter?: FilterExcludingWhere<CreditRatings>
  ): Promise<CreditRatings> {
    return this.creditRatingsRepository.findById(id, filter);
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/credit-ratings/{id}')
  @response(204, {
    description: 'CreditRatings PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditRatings, {partial: true}),
        },
      },
    })
    creditRatings: CreditRatings,
  ): Promise<void> {
    await this.creditRatingsRepository.updateById(id, creditRatings);
  }

  // @authenticate('jwt')
  // @authorize({roles: ['super_admin']})
  // @put('/credit-ratings/{id}')
  // @response(204, {
  //   description: 'CreditRatings PUT success',
  // })
  // async replaceById(
  //   @param.path.string('id') id: string,
  //   @requestBody() creditRatings: CreditRatings,
  // ): Promise<void> {
  //   await this.creditRatingsRepository.replaceById(id, creditRatings);
  // }

  // @del('/credit-ratings/{id}')
  // @response(204, {
  //   description: 'CreditRatings DELETE success',
  // })
  // async deleteById(@param.path.string('id') id: string): Promise<void> {
  //   await this.creditRatingsRepository.deleteById(id);
  // }
}
