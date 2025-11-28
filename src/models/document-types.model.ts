import {Entity, hasMany, model, property} from '@loopback/repository';
import {DocumentPlaceholders} from './document-placeholders.model';
import {Roles} from './roles.model';
import {DocumentRoles} from './document-roles.model';

@model({
  settings: {
    postgresql: {
      table: 'document_types',
      schema: 'public',
    },
    indexes: {
      uniqueDocumentType: {
        keys: {value: 1},
        options: {unique: true},
      },
    },
  },
})
export class DocumentTypes extends Entity {
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
  name: string;

  @property({
    type: 'string',
    required: true
  })
  value: string;

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

  @hasMany(() => DocumentPlaceholders)
  documentPlaceholders: DocumentPlaceholders[];

  @hasMany(() => Roles, {through: {model: () => DocumentRoles}})
  roles: Roles[];

  constructor(data?: Partial<DocumentTypes>) {
    super(data);
  }
}

export interface DocumentTypesRelations {
  // describe navigational properties here
}

export type DocumentTypesWithRelations = DocumentTypes & DocumentTypesRelations;
