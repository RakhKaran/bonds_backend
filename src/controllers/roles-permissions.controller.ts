import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
  import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
Roles,
RolePermissions,
Permissions,
} from '../models';
import {RolesRepository} from '../repositories';

export class RolesPermissionsController {
  constructor(
    @repository(RolesRepository) protected rolesRepository: RolesRepository,
  ) { }

  @get('/roles/{id}/permissions', {
    responses: {
      '200': {
        description: 'Array of Roles has many Permissions through RolePermissions',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Permissions)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Permissions>,
  ): Promise<Permissions[]> {
    return this.rolesRepository.permissions(id).find(filter);
  }

  @post('/roles/{id}/permissions', {
    responses: {
      '200': {
        description: 'create a Permissions model instance',
        content: {'application/json': {schema: getModelSchemaRef(Permissions)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Roles.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Permissions, {
            title: 'NewPermissionsInRoles',
            exclude: ['id'],
          }),
        },
      },
    }) permissions: Omit<Permissions, 'id'>,
  ): Promise<Permissions> {
    return this.rolesRepository.permissions(id).create(permissions);
  }

  @patch('/roles/{id}/permissions', {
    responses: {
      '200': {
        description: 'Roles.Permissions PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Permissions, {partial: true}),
        },
      },
    })
    permissions: Partial<Permissions>,
    @param.query.object('where', getWhereSchemaFor(Permissions)) where?: Where<Permissions>,
  ): Promise<Count> {
    return this.rolesRepository.permissions(id).patch(permissions, where);
  }

  @del('/roles/{id}/permissions', {
    responses: {
      '200': {
        description: 'Roles.Permissions DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Permissions)) where?: Where<Permissions>,
  ): Promise<Count> {
    return this.rolesRepository.permissions(id).delete(where);
  }
}
