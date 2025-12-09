import {Entity, model, property, belongsTo} from '@loopback/repository';
import {BondEstimations} from './bond-estimations.model';

@model({
  settings: {
    postgresql: {
      table: 'estimation_borrowing_details',
      schema: 'public',
    },
  },
})
export class EstimationBorrowingDetails extends Entity {
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
  lenderName: string;

  @property({
    type: 'number',
    required: true
  })
  lenderAmount: number;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      enum: [0, 1, 2],  // 0 => month, 1 => year 2 => quater
    },
  })
  repaymentTerms: number;

  @property({
    type: 'string',
    required: true
  })
  borrowingType: string;

  @property({
    type: 'number',
    required: true
  })
  interestPayment: number;

  @property({
    type: 'number',
    required: true
  })
  monthlyPrincipal: number;

  @property({
    type: 'number',
    required: true
  })
  monthlyInterest: number;

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

  @belongsTo(() => BondEstimations)
  bondEstimationsId: string;

  constructor(data?: Partial<EstimationBorrowingDetails>) {
    super(data);
  }
}

export interface EstimationBorrowingDetailsRelations {
  // describe navigational properties here
}

export type EstimationBorrowingDetailsWithRelations = EstimationBorrowingDetails & EstimationBorrowingDetailsRelations;
