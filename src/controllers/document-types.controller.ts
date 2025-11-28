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
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {authorize} from '../authorization';
import {DocumentTypes} from '../models';
import {DocumentTypesRepository} from '../repositories';

export class DocumentTypesController {
  constructor(
    @repository(DocumentTypesRepository)
    public documentTypesRepository: DocumentTypesRepository,
  ) { }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @post('/document-types')
  @response(200, {
    description: 'DocumentTypes model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(DocumentTypes)
      }
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DocumentTypes, {
            title: 'NewDocumentTypes',
            exclude: ['id'],
          }).definitions?.DocumentTypes?.properties,
          roles: {
            type: 'array',
            items: {type: 'string'}
          },
        },
      },
    })
    documentTypes: Omit<DocumentTypes, 'id'> & {roles: string[]},
  ): Promise<DocumentTypes> {
    const {roles, ...documentData} = documentTypes;
    const existingDocument = await this.documentTypesRepository.findOne({where: {value: documentData.value}});
    if (existingDocument) {
      throw new HttpErrors.BadRequest('Same document already exist');
    }
    const newDocumentType = await this.documentTypesRepository.create(documentData);
    if (newDocumentType) {
      for (const roleId of roles) {
        await this.documentTypesRepository.roles(newDocumentType.id).link(roleId);
      }
    }

    return newDocumentType;
  }

  @get('/document-types/count')
  @response(200, {
    description: 'DocumentTypes model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(DocumentTypes) where?: Where<DocumentTypes>,
  ): Promise<Count> {
    return this.documentTypesRepository.count(where);
  }

  @get('/document-types')
  @response(200, {
    description: 'Array of DocumentTypes model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(DocumentTypes, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(DocumentTypes) filter?: Filter<DocumentTypes>,
    @param.query.number('limit') limit?: number,
    @param.query.number('skip') skip?: number
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      count: number;
      documents: DocumentTypes[]
    }
  }> {
    const documents = await this.documentTypesRepository.find({
      ...filter,
      include: [
        {relation: 'documentPlaceholders'},
        {relation: 'roles'}
      ],
      limit: limit ?? 20,
      skip: skip ?? 0,
      order: ['createdAt desc']
    });

    const documentCount = await this.documentTypesRepository.count(filter?.where);

    return {
      success: true,
      message: 'Document Types',
      data: {
        count: documentCount.count,
        documents: documents
      }
    }
  }

  // @authenticate('jwt')
  // @authorize({roles: ['super_admin']})
  // @patch('/document-types')
  // @response(200, {
  //   description: 'DocumentTypes PATCH success count',
  //   content: {'application/json': {schema: CountSchema}},
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(DocumentTypes, {partial: true}),
  //       },
  //     },
  //   })
  //   documentTypes: DocumentTypes,
  //   @param.where(DocumentTypes) where?: Where<DocumentTypes>,
  // ): Promise<Count> {
  //   return this.documentTypesRepository.updateAll(documentTypes, where);
  // }

  @get('/document-types/{id}')
  @response(200, {
    description: 'DocumentTypes model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(DocumentTypes, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(DocumentTypes, {exclude: 'where'}) filter?: FilterExcludingWhere<DocumentTypes>
  ): Promise<DocumentTypes> {
    return this.documentTypesRepository.findById(id, {
      ...filter,
      include: [
        {relation: 'documentPlaceholders'},
        {relation: 'roles'}
      ],
    });
  }

  @authenticate('jwt')
  @authorize({roles: ['super_admin']})
  @patch('/document-types/{id}')
  @response(204, {
    description: 'DocumentTypes PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(DocumentTypes, {partial: true}).definitions?.DocumentTypes?.properties,
          roles: {
            type: 'array',
            items: {type: 'string'}
          }
        },
      },
    })
    documentTypes: DocumentTypes & {roles: string[]},
  ): Promise<void> {
    const {roles, ...documentTypesData} = documentTypes;
    await this.documentTypesRepository.updateById(id, documentTypesData);

    for (const roleId of roles) {
      await this.documentTypesRepository.roles(id).unlink(roleId);
    }

    for (const roleId of roles) {
      await this.documentTypesRepository.roles(id).link(roleId);
    }
  }

  // @put('/document-types/{id}')
  // @response(204, {
  //   description: 'DocumentTypes PUT success',
  // })
  // async replaceById(
  //   @param.path.string('id') id: string,
  //   @requestBody() documentTypes: DocumentTypes,
  // ): Promise<void> {
  //   await this.documentTypesRepository.replaceById(id, documentTypes);
  // }

  // @del('/document-types/{id}')
  // @response(204, {
  //   description: 'DocumentTypes DELETE success',
  // })
  // async deleteById(@param.path.string('id') id: string): Promise<void> {
  //   await this.documentTypesRepository.deleteById(id);
  // }
}
