import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  IsolationLevel,
  repository,
  Where
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
    // start tx
    const tx = await this.documentTypesRepository.dataSource.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED
    });

    try {
      // extract nav props so they are not passed into repository.create()
      const {roles = [], documentPlaceholders = [], ...documentData} = documentTypes;

      // check duplicate within tx
      const existingDocument = await this.documentTypesRepository.findOne(
        {where: {value: documentData.value}},
        {transaction: tx}
      );
      if (existingDocument) {
        throw new HttpErrors.BadRequest('Same document already exist');
      }

      // create document type (within tx)
      const newDocumentType = await this.documentTypesRepository.create(documentData, {transaction: tx});

      // link roles (use relation repository and pass transaction)
      if (roles && roles.length) {
        for (const roleId of roles) {
          await this.documentTypesRepository.roles(newDocumentType.id).link(roleId, {transaction: tx});
        }
      }

      // create placeholders using constrained relation repo (auto sets FK) and pass tx
      if (documentPlaceholders && documentPlaceholders.length) {
        for (const placeholder of documentPlaceholders) {
          await this.documentTypesRepository
            .documentPlaceholders(newDocumentType.id)
            .create(placeholder, {transaction: tx});
        }
      }

      await tx.commit();
      return newDocumentType;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
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
    // start transaction
    const tx = await this.documentTypesRepository.dataSource.beginTransaction({
      isolationLevel: IsolationLevel.READ_COMMITTED,
    });

    try {
      const {roles = [], documentPlaceholders = [], ...documentTypesData} = documentTypes;

      // 1. Update main entity
      await this.documentTypesRepository.updateById(id, documentTypesData, {transaction: tx});

      // 2. Update roles → remove all then re-add
      await this.documentTypesRepository.roles(id).unlinkAll({transaction: tx});
      for (const roleId of roles) {
        await this.documentTypesRepository.roles(id).link(roleId, {transaction: tx});
      }

      // 3. Replace existing placeholders safely
      await this.documentTypesRepository.documentPlaceholders(id).delete(undefined, {transaction: tx});
      for (const placeholder of documentPlaceholders) {
        await this.documentTypesRepository
          .documentPlaceholders(id)
          .create(placeholder, {transaction: tx});
      }

      // all good → commit
      await tx.commit();
    } catch (error) {
      // something failed → rollback everything
      await tx.rollback();
      throw error;
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
