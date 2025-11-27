import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Media} from './media.model';
import {CreditRatingAgencies} from './credit-rating-agencies.model';
import {CreditRatings} from './credit-ratings.model';
import {BondEstimations} from './bond-estimations.model';

@model({
  settings: {
    postgresql: {
      table: 'estimation_credit_ratings',
      schema: 'public',
    },
  },
})
export class EstimationCreditRatings extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    postgresql: {dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'date',
    required: true
  })
  validFrom: Date;

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

  @belongsTo(() => Media)
  ratingLetterId: string;

  @belongsTo(() => CreditRatingAgencies)
  creditRatingAgenciesId: string;

  @belongsTo(() => CreditRatings)
  creditRatingsId: string;

  @belongsTo(() => BondEstimations)
  bondEstimationsId: string;
  constructor(data?: Partial<EstimationCreditRatings>) {
    super(data);
  }
}

export interface EstimationCreditRatingsRelations {
  // describe navigational properties here
}

export type EstimationCreditRatingsWithRelations = EstimationCreditRatings & EstimationCreditRatingsRelations;
