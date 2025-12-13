import {belongsTo, Entity, model, property} from '@loopback/repository';
import {BondEstimations} from './bond-estimations.model';
import {InvestorCategory} from './investor-category.model';

@model({
  settings: {
    postgresql: {
      table: 'estimation_priliminary_bond_requirements',
      schema: 'public',
    },
  },
})
export class EstimationPriliminaryBondRequirements extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    postgresql: {dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'number',
    required: true
  })
  issueAmount: number;

  @property({
    type: 'boolean',
    required: true
  })
  security: boolean;

  @property({
    type: 'number',
    required: true
  })
  tenure: number;

  @property({
    type: 'number',
    required: true
  })
  roi: number;

  @property({
    type: 'number',
    required: true,
    jsonSchema: {
      enum: [0, 1, 2]   // 0 => monthly, 1 => quaterly, 2 => anually
    }
  })
  preferedPaymentCycle: number;

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

  @belongsTo(() => InvestorCategory)
  investorCategoryId: string;

  constructor(data?: Partial<EstimationPriliminaryBondRequirements>) {
    super(data);
  }
}

export interface EstimationPriliminaryBondRequirementsRelations {
  // describe navigational properties here
}

export type EstimationPriliminaryBondRequirementsWithRelations = EstimationPriliminaryBondRequirements & EstimationPriliminaryBondRequirementsRelations;
