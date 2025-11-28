import {belongsTo, Entity, model, property} from '@loopback/repository';
import {DocumentTypes} from './document-types.model';

@model({
  settings: {
    postgresql: {
      table: 'document_placeholders',
      schema: 'public',
    },
    indexes: {
      uniqueplaceholder: {
        keys: {fieldValue: 1, documentTypesId: 1},
        options: {unique: true},
      },
    },
  },
})
export class DocumentPlaceholders extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    postgresql: {dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'string',
    required: true
  })
  fieldName: string;

  @property({
    type: 'string',
    required: true
  })
  fieldValue: string;

  @property({
    type: 'boolean',
    required: true
  })
  isRequired: boolean;

  @property({
    type: 'string',
    required: true
  })
  description: string;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted?: boolean;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: Date;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  updatedAt?: Date;

  @property({
    type: 'date',
  })
  deletedAt?: Date;

  @belongsTo(() => DocumentTypes)
  documentTypesId: string;

  constructor(data?: Partial<DocumentPlaceholders>) {
    super(data);
  }
}

export interface DocumentPlaceholdersRelations {
  // describe navigational properties here
}

export type DocumentPlaceholdersWithRelations = DocumentPlaceholders & DocumentPlaceholdersRelations;
