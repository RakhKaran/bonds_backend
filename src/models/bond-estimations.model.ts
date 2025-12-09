import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {CompanyProfiles} from './company-profiles.model';
import {EstimationCreditRatings} from './estimation-credit-ratings.model';
import {EstimationBorrowingDetails} from './estimation-borrowing-details.model';

@model({
  settings: {
    postgresql: {
      table: 'bond_estimations',
      schema: 'public',
    },
  },
})
export class BondEstimations extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    postgresql: {dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'object',
    postgresql: {dataType: 'jsonb'},
    jsonSchema: {
      type: 'object',
      properties: {
        cashBalance: {type: 'string'},
        cashBalanceDate: {type: 'string', format: 'date-time'},
        bankBalance: {type: 'string'},
        bankBalanceDate: {type: 'string', format: 'date-time'},
      },
    },
  })
  fundPosition?: {
    cashBalance: string;
    cashBalanceDate: string | Date;
    bankBalance: string;
    bankBalanceDate: string | Date;
  };

  @property({
    type: 'object',
    postgresql: {dataType: 'jsonb'},
    jsonSchema: {
      type: 'object',
      properties: {
        shareCapital: {type: 'number'},
        reserveSurplus: {type: 'number'},
        netWorth: {type: 'number'},
      },
    },
  })
  capitalDetails?: {
    shareCapital: number;
    reserveSurplus: number;
    netWorth: number;
  };

  @property({
    type: 'object',
    postgresql: {dataType: 'jsonb'},
    jsonSchema: {
      type: 'object',
      properties: {
        netProfit: {type: 'number'},
        EBIDTA: {type: 'number'},
      },
    },
  })
  profitabilityDetails?: {
    netProfit: number;
    EBIDTA: number;
  };

  @property({
    type: 'object',
    postgresql: {dataType: 'jsonb'},
    jsonSchema: {
      type: 'object',
      properties: {
        debtEquityRatio: {type: 'number'},
        currentRatio: {type: 'number'},
        netWorth: {type: 'number'},
        quickRatio: {type: 'number'},
        returnOnEquity: {type: 'number'},
        debtServiceCoverageRatio: {type: 'number'},
        returnOnAsset: {type: 'number'},
      },
    },
  })
  financialRatios?: {
    debtEquityRatio: number;
    currentRatio: number;
    netWorth: number;
    quickRatio: number;
    returnOnEquity: number;
    debtServiceCoverageRatio: number;
    returnOnAsset: number;
  };

  @property({
    type: 'array',
    itemType: 'string'
  })
  currentProgress: string[];

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

  @belongsTo(() => CompanyProfiles)
  companyProfilesId: string;

  @hasMany(() => EstimationCreditRatings)
  estimationCreditRatings: EstimationCreditRatings[];

  @hasMany(() => EstimationBorrowingDetails)
  estimationBorrowingDetails: EstimationBorrowingDetails[];

  constructor(data?: Partial<BondEstimations>) {
    super(data);
  }
}

export interface BondEstimationsRelations {
  // describe navigational properties here
}

export type BondEstimationsWithRelations = BondEstimations & BondEstimationsRelations;

