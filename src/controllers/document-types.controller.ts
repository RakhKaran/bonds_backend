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
import {DocumentPlaceholdersRepository, DocumentTypesRepository} from '../repositories';

export class DocumentTypesController {
  constructor(
    @repository(DocumentTypesRepository)
    public documentTypesRepository: DocumentTypesRepository,
    @repository(DocumentPlaceholdersRepository)
    public documentPlaceholdersRepository: DocumentPlaceholdersRepository
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
          documentPlaceholders: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fieldValue: {type: 'string'},
                fieldName: {type: 'string'},
                isRequired: {type: 'string'},
                description: {type: 'string'},
                isActive: {type: 'boolean'},
                isDeleted: {type: 'boolean'}
              }
            }
          }
        },
      },
    })
    documentTypes: Omit<DocumentTypes, 'id'> & {
      roles: string[],
      documentPlaceholders: Array<{
        fieldName: string;
        fieldValue: string;
        isRequired: boolean;
        description: string;
        isActive: boolean;
        isDeleted: boolean;
      }>
    },
  ): Promise<DocumentTypes> {
    const {roles, documentPlaceholders, ...documentData} = documentTypes;
    const existingDocument = await this.documentTypesRepository.findOne({where: {value: documentData.value}});
    if (existingDocument) {
      throw new HttpErrors.BadRequest('Same document already exist');
    }
    const newDocumentType = await this.documentTypesRepository.create(documentData);
    if (newDocumentType) {
      for (const roleId of roles) {
        await this.documentTypesRepository.roles(newDocumentType.id).link(roleId);
      }

      for (const documentPlaceholderData of documentPlaceholders) {
        await this.documentTypesRepository.documentPlaceholders(newDocumentType.id).create(documentPlaceholderData);
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
          },
          documentPlaceholders: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fieldValue: {type: 'string'},
                fieldName: {type: 'string'},
                isRequired: {type: 'string'},
                description: {type: 'string'},
                isActive: {type: 'boolean'},
                isDeleted: {type: 'boolean'}
              }
            }
          }
        },
      },
    })
    documentTypes: DocumentTypes & {
      roles: string[],
      documentPlaceholders: Array<{
        fieldName: string;
        fieldValue: string;
        isRequired: boolean;
        description: string;
        isActive: boolean;
        isDeleted: boolean;
      }>
    },
  ): Promise<void> {
    const {roles, documentPlaceholders, ...documentTypesData} = documentTypes;
    await this.documentTypesRepository.updateById(id, documentTypesData);

    await this.documentTypesRepository.roles(id).unlinkAll();
    for (const roleId of roles) {
      await this.documentTypesRepository.roles(id).link(roleId);
    }

    await this.documentTypesRepository.documentPlaceholders(id).delete();

    for (const placeholder of documentPlaceholders) {
      await this.documentTypesRepository.documentPlaceholders(id).create(placeholder);
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
